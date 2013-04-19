
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , redis = require('redis')
  , async = require('async')

var client = redis.createClient();

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 4003);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.compress())
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req,res){
	res.end('.. documentation and goodies coming soon');
});
app.get('/sources', function(req,res){
	client.smembers('articles::sources', function(err, sources){
		res.json({sources:sources});
	})
})
app.get('/fetch', function(req, res){
	var cmd;
	client.smembers('articles::sources', function(err, sources){
		var build = {
			content:{}
		};
		var sources_build = req.query.sources ? req.query.sources.split(',') : sources;
		var limit = req.query.limit ? req.query.limit -1 : 5;
		
		//remove empty values
		sources_build.clean("");
		
		async.forEach(sources_build, function(source, fn){
			//remove sources which dont exist
			if(sources.indexOf(source) === -1){
				build.content[source] = [];
				return fn(null);
			};
			
			client.lrange('articles:' + source, 0, limit, function(err, data){
				var parsed = [];
				data.forEach(function(e){
					var doc = JSON.parse(e);
					parsed.push(doc);
					console.log(doc.title);
				})
				build.content[source] = parsed;
				return fn(null);
			});
		}, function(){
			res.json(build);
		});
	});

});

app.get('/fetch/:source/:url', function(req,res){
	var source = req.params.source
	 ,  url = req.params.url;
	 client.hget(source, url, function(err, data){
	 	if(err){
	 		return res.json({error:"An error occured"});
	 	}
	 	if(data == null){
	 		return res.json({error:"Article not found!"});
	 	}
	 	var obj = {};
 		obj.data = JSON.parse(data);
 		res.json(obj);
	 });
});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// clean array

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};
