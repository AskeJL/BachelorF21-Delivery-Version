const {createServer} = require('http');
const url = require("url");
var express = require('express');
var app = express();
const cors = require('cors');
const { exec } = require("child_process");
const Client = require('kubernetes-client').Client
const config = require('kubernetes-client/backends/request').config

app.use(express.json(), cors());



const Request = require('kubernetes-client/backends/request')
const client = new Client({version: '1.13' })



async function main (client) {

  //Unicast pipelines
  //var gstreamerPipeline_sendToOthers = "gst-launch-1.0 -e udpsrc port=7088 ! multiudpsink clients="
  //var gstreamerPipeline_sendToJanus = "gst-launch-1.0 -e udpsrc port=49153 ! udpsink host=0.0.0.0 port=7089"

  //Multicast pipelines
  var gstreamerPipeline_sendToOthers = "gst-launch-1.0 -e udpsrc port=7088 ! udpsink host=239.0.15.1 auto-multicast=true port=5700"
  var gstreamerPipeline_sendToJanus = "gst-launch-1.0 -v -e udpsrc multicast-group=239.0.15.1 auto-multicast=true port=5700 ! udpsink host=0.0.0.0 port=7089"
  
  try {
    
    var sleepTime = randomRange(40000, 60000)
    console.log(sleepTime)
    await sleep(sleepTime)
   
    //
    // Fetch all the pods for when unicast is used
  /* const pods = await client.api.v1.namespaces('userpods').pods().get()
    pods.body.items.forEach((item) => {
      gstreamerPipeline = gstreamerPipeline + item.status.podIP + ":49153,"
    })
    gstreamerPipeline = gstreamerPipeline.slice(0,-1) */

  }  catch (err) {
    console.error('Error: ', err)
  }
  
  console.log(gstreamerPipeline_sendToOthers)

  exec(gstreamerPipeline_sendToOthers,(error, stdout, stderr)=>{
    console.log(stdout)
    console.log(stderr)
    if(error){
      console.log('error: ${sender pipeline}');
      return;
    }
  })
  
  exec(gstreamerPipeline_sendToJanus,(error, stdout, stderr)=>{
    console.log(stdout)
    console.log(stderr)
    if(error){
      console.log('error: ${listener pipeline}');
      return;
    }
  })
}

app.get('/', (request,response) => {
	console.log("get request");
	response.json(AIDS);
	response.end();
});


main(client)
app.listen(7000);

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomRange(min, max){
  return Math.random() * (max - min) + min;
}