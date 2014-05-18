var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server); //socket.io listens to http server
var users = {};
server.listen(3000);
app.get('/', function(req,res){
	res.sendfile(__dirname + '/index.html');
});

//all my socket.io code goes inside the function
io.sockets.on('connection', function(socket){
	socket.on('new user', function(data,callback){
		if(data in users){
			callback(false);
		}
		else{
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicknames();
		}
	});
	function updateNicknames(){
		io.sockets.emit('usernames', Object.keys(users));
	}
	socket.on('send-message', function(data,callback){
		var msg = data.trim();
		if(msg.substr(0,3) === '/w '){
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			if(ind !== -1){
				var name = msg.substring(0,ind);
				var msg = msg.substring(ind+1);
				if(name in users){
					users[name].emit('whisper', { msg : data , nick : socket.nickname});
				}
				else{
					callback('Error! Enter valid user');
				}
			}
			else{
				callback('Error! Please enter a message for your whistper');
			}
		}
		else{
			io.sockets.emit('new message', { msg : data , nick : socket.nickname}); //sent to everyone connected including me
		}
		
		//socket.broadcast.emit('new message', data); //sent to everyone except me
	});
	
	socket.on('disconnect',function(data){
		if(!socket.nickname)
			return;
		delete users[socket.nickname];
		updateNicknames();
	});
});