//! Native Linux process only. This is never bundled into the web application.
mod local_web;
use std::{error::Error, time::{Duration, Instant}};
use evdev::{uinput::VirtualDevice, AbsInfo, AbsoluteAxisCode as A, AttributeSet, BusType, EventType, InputEvent, InputId, KeyCode as K, UinputAbsSetup};
use futures_util::{SinkExt, StreamExt};
use rand::Rng;
use serde::Deserialize;
use serde_json::{json, Value};
use tokio::{net::{TcpListener, TcpStream},time::timeout};
use tokio_tungstenite::{accept_hdr_async_with_config,tungstenite::{handshake::server::{ErrorResponse,Request,Response},protocol::WebSocketConfig,Message}};
type Result<T> = std::result::Result<T,Box<dyn Error>>;
const BUTTONS:[(&str,K);12]=[("cross",K::BTN_SOUTH),("circle",K::BTN_EAST),("square",K::BTN_WEST),("triangle",K::BTN_NORTH),("l1",K::BTN_TL),("r1",K::BTN_TR),("create",K::BTN_SELECT),("options",K::BTN_START),("system",K::BTN_MODE),("l3",K::BTN_THUMBL),("r3",K::BTN_THUMBR),("touchpad",K::BTN_TRIGGER_HAPPY1)];
const AXES:[A;8]=[A::ABS_X,A::ABS_Y,A::ABS_RX,A::ABS_RY,A::ABS_Z,A::ABS_RZ,A::ABS_HAT0X,A::ABS_HAT0Y];
#[derive(Debug,Deserialize)]
#[serde(deny_unknown_fields)]
struct Touch {active:bool,x:f64,y:f64}
#[derive(Debug,Deserialize)]
#[serde(rename_all="camelCase",deny_unknown_fields)]
struct Input {r#type:String,version:u8,device_id:String,sequence:u64,timestamp:f64,left:[f64;2],right:[f64;2],l2:f64,r2:f64,buttons:Vec<String>,dpad:[f64;2],touch:Touch,gyro:Option<[f64;3]>,acceleration:Option<[f64;3]>,battery:Option<f64>,extensions:Option<Value>}
fn valid_range(v:f64,min:f64,max:f64)->bool{v.is_finite()&&(min..=max).contains(&v)}
impl Input {fn validate(&self,id:&str,last:u64)->bool{
 self.r#type=="input"&&self.version==1&&self.device_id==id&&id.len()<=64&&self.sequence>last&&valid_range(self.timestamp,0.,f64::MAX)
 &&self.left.iter().chain(self.right.iter()).all(|v|valid_range(*v,-1.,1.))&&valid_range(self.l2,0.,1.)&&valid_range(self.r2,0.,1.)
 &&self.dpad.iter().all(|v|[-1.,0.,1.].contains(v))&&self.buttons.len()<=12&&self.buttons.iter().all(|b|BUTTONS.iter().any(|(name,_)|name==b))
 &&valid_range(self.touch.x,0.,1.)&&valid_range(self.touch.y,0.,1.)&&self.battery.is_none_or(|v|valid_range(v,0.,1.))
 &&self.gyro.iter().flatten().chain(self.acceleration.iter().flatten()).all(|v|v.is_finite())
 }}
fn create_gamepad()->std::io::Result<VirtualDevice>{
 let mut keys=AttributeSet::<K>::new();for (_,key) in BUTTONS{keys.insert(key);}
 let mut builder=VirtualDevice::builder()?.name("DualSense Bridge Xbox-style Gamepad").input_id(InputId::new(BusType::BUS_USB,0x045e,0x028e,0x0110)).with_keys(&keys)?;
 for(i,axis)in AXES.into_iter().enumerate(){let(min,max)=match i{0..=3=>(-32767,32767),4..=5=>(0,255),_=>(-1,1)};builder=builder.with_absolute_axis(&UinputAbsSetup::new(axis,AbsInfo::new(0,min,max,0,0,0)))?;}builder.build()
}
fn axis_values(input:&Input)->[i32;8]{[(input.left[0]*32767.).round()as i32,(input.left[1]*32767.).round()as i32,(input.right[0]*32767.).round()as i32,(input.right[1]*32767.).round()as i32,(input.l2*255.).round()as i32,(input.r2*255.).round()as i32,input.dpad[0]as i32,input.dpad[1]as i32]}
fn emit(pad:&mut VirtualDevice,input:Option<&Input>)->std::io::Result<()>{let mut events=Vec::with_capacity(20);for(name,key)in BUTTONS{events.push(InputEvent::new(EventType::KEY.0,key.0,i32::from(input.is_some_and(|v|v.buttons.iter().any(|b|b==name)))));}let values=input.map(axis_values).unwrap_or([0;8]);for(axis,value)in AXES.into_iter().zip(values){events.push(InputEvent::new(EventType::ABSOLUTE.0,axis.0,value));}pad.emit(&events)}
fn new_pin()->String{format!("{:06}",rand::rng().random_range(0..1_000_000))}
fn check_pin(expected:&str,received:&str,age:Duration)->bool{age<Duration::from_secs(120)&&received.len()==6&&constant_time_eq::constant_time_eq(expected.as_bytes(),received.as_bytes())}
async fn session(stream:TcpStream,origin:&str,pin:&str,issued:Instant,pc_name:&str)->Result<()>{
 let callback=|req:&Request,response:Response|{if req.uri().path()=="/"&&req.headers().get("origin").and_then(|h|h.to_str().ok())==Some(origin){Ok(response)}else{let mut denied=ErrorResponse::new(Some("Origin not allowed".into()));*denied.status_mut()=tokio_tungstenite::tungstenite::http::StatusCode::FORBIDDEN;Err(denied)}};
 let config=WebSocketConfig::default().max_message_size(Some(4096)).max_frame_size(Some(4096));
 let mut ws=timeout(Duration::from_secs(3),accept_hdr_async_with_config(stream,callback,Some(config))).await??;
 let pair=timeout(Duration::from_secs(3),ws.next()).await?.ok_or("Socket closed")??;
 let pair:Value=serde_json::from_str(pair.to_text()?)?;
 let id=pair["deviceId"].as_str().unwrap_or("");
 if pair["type"]!="pair"||pair["version"]!=1||id.is_empty()||id.len()>64||!check_pin(pin,pair["pin"].as_str().unwrap_or(""),issued.elapsed()){
  ws.send(Message::Text(json!({"type":"error","message":"Invalid or expired PIN. Check the current PC PIN."}).to_string().into())).await?;return Err("Pairing rejected".into());
 }
 // Never report an active controller before /dev/uinput has been opened and created.
 let mut pad=match create_gamepad(){Ok(pad)=>pad,Err(error)=>{ws.send(Message::Text(json!({"type":"error","message":format!("Could not create /dev/uinput gamepad: {error}")}).to_string().into())).await?;return Err(error.into());}};
 println!("Paired device; /dev/uinput gamepad created. Touch coordinates and motion are received but not mapped; rumble unsupported.");
 let result:Result<()>=async {
  ws.send(Message::Text(json!({"type":"paired","version":1,"pcName":pc_name,"virtualGamepad":true}).to_string().into())).await?;
  let mut last=0;let mut rate_start=Instant::now();let mut count=0;
  loop{
   let incoming=tokio::select!{value=timeout(Duration::from_secs(6),ws.next())=>value?,_=tokio::signal::ctrl_c()=>break};
   let Some(incoming)=incoming else{break};
   match incoming?{
    Message::Text(text)=>{count+=1;if rate_start.elapsed()>=Duration::from_secs(1){rate_start=Instant::now();count=0;}if count>240{return Err("Input rate exceeded".into());}
     let value:Value=serde_json::from_str(text.as_str())?;
     match value["type"].as_str(){
      Some("input")=>{let input:Input=serde_json::from_value(value)?;if !input.validate(id,last){return Err("Invalid or out-of-order input".into());}last=input.sequence;emit(&mut pad,Some(&input))?;},
      Some("ping")=>{let timestamp=value["timestamp"].as_f64().filter(|v|v.is_finite()&&*v>=0.).ok_or("Invalid ping")?;ws.send(Message::Text(json!({"type":"pong","timestamp":timestamp}).to_string().into())).await?;},
      Some("disconnect")=>break,_=>return Err("Unexpected message".into())
     }
    },Message::Close(_)=>break,Message::Ping(_)=>ws.flush().await?,_=>return Err("Text frames required".into())
   }
  }Ok(())
 }.await;
 let cleanup=emit(&mut pad,None);drop(pad);println!("All buttons and axes reset; virtual device removed.");cleanup?;result
}
#[tokio::main]
async fn main()->Result<()>{
 let bind=std::env::var("DSB_BIND").unwrap_or_else(|_|"127.0.0.1:8765".into());
 let origin=std::env::var("DSB_ORIGIN").unwrap_or_else(|_|"http://localhost:8080".into());
 let http_bind=std::env::var("DSB_HTTP_BIND").unwrap_or_else(|_|"127.0.0.1:8081".into());
 let pc_name=std::env::var("DSB_PC_NAME").unwrap_or_else(|_|"Linux PC".into());
 let listener=TcpListener::bind(&bind).await?;println!("DualSense Bridge PC · WS listening at {bind} · allowed origin {origin}");
 let http_listener=TcpListener::bind(&http_bind).await?;
 let ws_port=listener.local_addr()?.port();
 tokio::spawn(async move{if let Err(error)=local_web::serve(http_listener,ws_port).await{eprintln!("Local controller server stopped: {error}");}});
 println!("Local gameplay controller: http://{http_bind} · use play.sh to configure phone access and origin together.");
 println!("Use a TLS reverse proxy for the hosted HTTPS controller. One phone at a time. No persistent trusted devices yet.");
 loop{let pin=new_pin();let issued=Instant::now();println!("Pairing PIN: {pin} · expires in 120 seconds");let mut attempts=0;
  loop{let(stream,peer)=tokio::select!{value=timeout(Duration::from_secs(120).saturating_sub(issued.elapsed()),listener.accept())=>match value{Ok(value)=>value?,Err(_)=>break},_=tokio::signal::ctrl_c()=>return Ok(())};println!("Connection from {peer}");let result=session(stream,&origin,&pin,issued,&pc_name).await;match result{Ok(())=>break,Err(error)=>{eprintln!("Session ended: {error}");attempts+=1;if attempts>=5{eprintln!("Too many failed attempts. Cooling down 30 seconds.");tokio::time::sleep(Duration::from_secs(30)).await;break;}if issued.elapsed()>=Duration::from_secs(120){break;}}}
  }
 }
}
#[cfg(test)] mod tests{use super::*;
 fn input()->Input{serde_json::from_value(json!({"type":"input","version":1,"deviceId":"test","sequence":1,"timestamp":0,"left":[0,0],"right":[0,0],"l2":0,"r2":0,"buttons":[],"dpad":[0,0],"touch":{"active":false,"x":0,"y":0}})).unwrap()}
 #[test]fn normalized_axes_and_triggers(){let mut i=input();i.left=[-1.,1.];i.right=[1.,-1.];i.l2=1.;i.r2=0.5;assert_eq!(axis_values(&i),[-32767,32767,32767,-32767,255,128,0,0]);}
 #[test]fn reject_bad_input(){let mut i=input();assert!(i.validate("test",0));i.l2=1.1;assert!(!i.validate("test",0));}
 #[test]fn reject_wrong_device_and_sequence(){let i=input();assert!(!i.validate("other",0));assert!(!i.validate("test",1));}
 #[test]fn pin_expiration_and_authentication(){assert!(check_pin("123456","123456",Duration::from_secs(119)));assert!(!check_pin("123456","123456",Duration::from_secs(120)));assert!(!check_pin("123456","000000",Duration::ZERO));}
 #[test]fn dpad_discrete(){let mut i=input();i.dpad=[1.,-1.];assert!(i.validate("test",0));i.dpad=[0.5,0.];assert!(!i.validate("test",0));}
}
