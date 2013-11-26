var appPort = process.env.PORT || 8080;
var log4js = require('log4js');
var express = require('express'), app = express();
var http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

var jade = require('jade');
var pseudoArray = ['admin']; 

// Views Options

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set("view options", { layout: false })

app.configure(function() {
	app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res){
  res.render('home.jade');
});
server.listen(appPort);
console.log("Server listening on port 8080");

var users = 0;

io.sockets.on('connection', function (socket) {
    users += 1;
    reloadUsers();
	socket.on('message', function (data) {
		if(pseudoSet(socket))
		{
		    logUserInChat();

			var transmit = {date : new Date().toISOString(), pseudo : returnPseudo(socket), message : data};
			socket.broadcast.emit('message', transmit);
			console.log("user " + transmit['pseudo'] + " said \"" + data + "\"");
            
		}
	});
	socket.on('setPseudo', function (data) {

		if (pseudoArray.indexOf(data) == -1)
		{
			socket.set('pseudo', data, function(){
				pseudoArray.push(data);
				socket.emit('pseudoStatus', 'ok');
				console.log("user " + data + "connected");
			});
		}
		else
		{
			socket.emit('pseudoStatus', 'error')
		}
	});
	socket.on('disconnect', function () {
		users -= 1;
		reloadUsers();
		if (pseudoSet(socket))
		{
		    logUserDisconnected();

            
			var pseudo;
			socket.get('pseudo', function(err, name) {
				pseudo = name;
			});
			var index = pseudoArray.indexOf(pseudo);
			pseudo.slice(index - 1, 1);
        }
	});
});

    function reloadUsers() { 
        io.sockets.emit('nbUsers', {"nb": users});
    }
    function pseudoSet(socket) {
        var test;
        socket.get('pseudo', function(err, name) {
            if (name == null ) test = false;
            else test = true;
        });
        return test;
    }
    function returnPseudo(socket) {
        var pseudo;
        socket.get('pseudo', function(err, name) {
            if (name == null ) pseudo = false;
            else pseudo = name;
        });
        return pseudo;
    }

// Loggar n�r en anv�ndare skriver n�got i chatten!
    function logUserInChat() {
        logger.trace('Waiting for user to come online...');
        logger.debug('User is choosing a name');
        logger.info('User is now online to the chat!');
        logger.warn('THE USER IS NOW ONLINE!!');
        logger.error('USER IS ON THE LINE!!');
        logger.fatal('A user has posted something in the chat');

    };

// Loggar n�r en anv�ndare st�nger av chatten!
    function logUserDisconnected() {
        logger.trace('User disconnected..');
        logger.info('User is offline!');
        logger.error('Disconnected');
    };


    var logger = new log4js.getLogger('users');
    logger.setLevel('ERROR');
    log4js.loadAppender('file');
    log4js.addAppender(new log4js.appenders.file('logs/users.log'), 'users');

    log4js.configure({
        appenders: [
          { type: 'console' },
          { type: 'file', filename: 'logs/users.log', category: 'users' }
        ]
    });