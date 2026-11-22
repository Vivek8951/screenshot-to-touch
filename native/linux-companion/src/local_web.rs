//! Minimal bounded native static file server. No cloud or file-system traversal.
use std::{io, sync::Arc, time::Duration};
use tokio::{io::{AsyncReadExt,AsyncWriteExt},net::{TcpListener,TcpStream},sync::Semaphore,time::timeout};
const HTML:&str=include_str!("../web/index.html");
const CSS:&str=include_str!("../web/gameplay.css");
const JS:&str=include_str!("../web/gameplay.js");
fn asset(path:&str,ws_port:u16)->Option<(&'static str,String)>{match path{
 "/"=>Some(("text/html; charset=utf-8",HTML.replace("__WS_PORT__",&ws_port.to_string()))),
 "/gameplay.css"=>Some(("text/css; charset=utf-8",CSS.into())),
 "/gameplay.js"=>Some(("text/javascript; charset=utf-8",JS.into())),_=>None
}}
async fn handle(mut socket:TcpStream,ws_port:u16)->io::Result<()>{
 let mut buffer=vec![0u8;4096];let mut length=0;
 loop{if length==buffer.len(){return Ok(());}let n=socket.read(&mut buffer[length..]).await?;if n==0{return Ok(());}length+=n;if buffer[..length].windows(4).any(|w|w==b"\r\n\r\n"){break;}}
 let request=String::from_utf8_lossy(&buffer[..length]);let mut parts=request.lines().next().unwrap_or("").split_whitespace();let method=parts.next().unwrap_or("");let path=parts.next().unwrap_or("");
 let(status,mime,body)=if method!="GET"{("405 Method Not Allowed","text/plain",String::from("GET required"))}else{match asset(path,ws_port){Some((mime,body))=>("200 OK",mime,body),None=>("404 Not Found","text/plain",String::from("Not found"))}};
 let header=format!("HTTP/1.1 {status}\r\nContent-Type: {mime}\r\nContent-Length: {}\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nContent-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src ws: wss:; frame-ancestors 'none'; base-uri 'none'\r\nConnection: close\r\n\r\n",body.len());
 socket.write_all(header.as_bytes()).await?;socket.write_all(body.as_bytes()).await?;socket.shutdown().await
}
pub async fn serve(listener:TcpListener,ws_port:u16)->io::Result<()>{
 let permits=Arc::new(Semaphore::new(16));loop{let(socket,_)=listener.accept().await?;let Ok(permit)=permits.clone().try_acquire_owned()else{drop(socket);continue;};tokio::spawn(async move{let _permit=permit;let _=timeout(Duration::from_secs(5),handle(socket,ws_port)).await;});}
}
#[cfg(test)]mod tests{use super::*;#[test]fn serves_only_controller_assets(){assert!(asset("/",8765).unwrap().1.contains("content=\"8765\""));assert!(asset("/gameplay.js",8765).is_some());assert!(asset("/../../etc/passwd",8765).is_none());}}
