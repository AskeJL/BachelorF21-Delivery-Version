const {createServer} = require('http');
const url = require("url");
var fs = require('fs');
var express = require('express');
const io = require('socket.io')();
var app = express();
const Client = require('kubernetes-client').Client
const config = require('kubernetes-client/backends/request').config
app.use(express.static('public'));
app.use(express.json());
const Request = require('kubernetes-client/backends/request')
const client = new Client({version: '1.13' })

let pod = {
	"apiVersion": "v1",
	"kind": "Deployment",
	"metadata": {
	  "name": "",
	  "namespace": "userpods"
	},
	"spec": {
	  "containers": [
		{
		  "image": "gstreamer",
		  "name": "gstreamer",
		  "imagePullPolicy": "Never",
		  "resources": {},
		  "ports": [
			{
			  "containerPort": 49153
			}
		  ]
		},
		{
			"image": "canyan/janus-gateway",
			"name": "gateway",
			"imagePullPolicy": "Never",
			"resources": {},
			"ports": [
			  {
				"containerPort": 8088
			  }
			]
		  }
	  ]
	}
  }

  var playerIDs = []
  var players = {players: []}


app.get('/', (request,response) => {
	fs.readFile("index.html", function (error, htmlRes) {
		if (error) {
			response.writeHead(400);
			response.write("Shitter's clogged, SOS");
			response.end();
		} else {
			response.sendFile('/app/public/js/janus.js');
			response.sendFile('/app/public/js/audiotest.js');
			response.sendFile('/app/public/Daco_5373298.png');
			response.sendFile('/app/public/BlueDot.png');
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(htmlRes);
			response.end();
		}
	});
});

app.post('/position', (request,response) => {
	response.writeHead(404, {"Content-Type": "text/html"});
	response.end();
});

io.on('connection', socket => {
	socket.emit('init', players)
	socket.on('playerCreated', handlePlayerCreated);
	socket.on('playerMoved', handlePlayerMoved);

	function handlePlayerMoved(player){
		players.players.forEach(i => {
			if(i[0] == player[0]){
				players.players[players.players.indexOf(i)] = player
			}
		})
		socket.broadcast.emit('aPlayerMoved' , player)
	}
	async function handlePlayerCreated(player){
		if(!playerIDs.includes(player[0]))
		players.players.push(player)
		playerIDs.push(player[0])
		socket.broadcast.emit('newPlayer', player)
		function makeid(length) {
			var result           = [];
			var characters       = 'abcdefghijklmnopqrstuvwxyz';
			var charactersLength = characters.length;
			for ( var i = 0; i < length; i++ ) {
			  result.push(characters.charAt(Math.floor(Math.random() * 
		 charactersLength)));
		   }
		   return result.join('');
		}
		let janus_address = await create_and_fetch_IP(client, makeid(8))
		console.log(janus_address + " " + "Janus address")
		await socket.emit('IP', janus_address)
	}
});

async function create_and_fetch_IP (client, name) {
	pod.metadata.name = name
	let deployment = {
		"apiVersion": "apps/v1",
		"kind": "Deployment",
		"metadata": {
		  "creationTimestamp": null,
		  "labels": {
			"app": name
		  },
		  "name": name
		},
		"spec": {
		  "replicas": 1,
		  "selector": {
			"matchLabels": {
			  "app": name
			}
		  },
		  "strategy": {},
		  "template": {
			"metadata": {
			  "creationTimestamp": null,
			  "labels": {
				"app": name
			  }
			},
			"spec": {
				"containers": [
					{
					  "image": "gstreamer",
					  "name": "gstreamer",
					  "imagePullPolicy": "Never",
					  "resources": {},
					  "ports": [
						{
						  "containerPort": 49153
						}
					  ]
					},
					{
						"image": "canyan/janus-gateway",
						"name": "gateway",
						"imagePullPolicy": "Never",
						"resources": {},
						"ports": [
						  {
							"containerPort": 8088
						  }
						]
					  }
				  ]
			}
		  }
		},
		"status": {}
	  }
	  let service = {
		"apiVersion": "v1",
		"kind": "Service",
		"metadata": {
		  "name": name,
		  "labels": {
			"run": name
		  }
		},
		"spec": {
		  "ports": [
			{
			  "port": 8088,
			  "protocol": "TCP"
			}
		  ],
		  "selector": {
			"app": name
		  },
		  "type": "NodePort"
		}
	  }
	try {

		  //Make deployment for user
		  const createDeployment = await client.apis.apps.v1.namespaces('userpods').deployments.post({ body: deployment })
	  
	} catch (err) {
	  console.error('Error: ', err)
	}
	try { const createService = await client.api.v1.namespaces('userpods').services.post({ body: service })}
	catch(err){console.error('Error: ', err)}

	try { 
		await sleep(9000)
		const getService = await client.api.v1.namespaces('userpods').services(name).get()
		let portsArray = getService.body.spec.ports
		let j = portsArray[0]
		port= j.nodePort
		return 'http://172.24.140.58:'+ port}
	catch(err){console.error('Error: ', err)}
  }
  function sleep(ms) {
	return new Promise((resolve) => {
	  setTimeout(resolve, ms);
	});
  }
io.listen(3000)
app.listen(80);