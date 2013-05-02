
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
  , mongoose = require('mongoose')

var idb = mongoose.createConnection('mongodb://localhost/featured');
var featured = idb.model('tweets', mongoose.Schema({},{strict:false}));


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
		var map = {
			"sun": {
				name:"sun",
				dhivehi:"ސަން",  
				image_url:"http://res.cloudinary.com/iulogy/image/upload/v1367119077/sun_ocinbk.png", 
				english:"Sun",
				type:"News & current affairs"
			},
			"haveeru": {
				name:"haveeru",
				dhivehi: "ހަވީރު",
				image_url:"http://res.cloudinary.com/iulogy/image/upload/v1367119077/haveeru_r96ko1.png", 
				english:"Haveeru",
				type:"News & current affairs"

			},
			"mvyouth": {
				name:"mvyouth",
				dhivehi: "އެމްވީ ޔޫތު",
				image_url:"http://res.cloudinary.com/iulogy/image/upload/v1367119080/mvyouth_ntbeqd.png", 
				english:"Mv Youth",
				type:"News & current affairs"

			},
			"mvexposed": {
				name:"mvexposed",
				dhivehi:"އެމްވީ އެކްސްޕޯސްޑ",  
				image_url:"http://res.cloudinary.com/iulogy/image/upload/v1367119076/mvexposed_vaqw9j.png", 
				english:"Mv Exposed",
				type:"Amateur news"

			},
			"vmedia": {
				name:"vmedia",
				dhivehi:"ވީ މީޑިއާ",  
				image_url:"http://res.cloudinary.com/iulogy/image/upload/c_crop,h_56,x_50,y_43/v1367119076/vmedia_wxsmdm.png", 
				english:"vMedia",
				type:"News & current affairs"

			},
			"raajje": {
				name:"raajje",
				dhivehi:"ރާއްޖެ",  
				image_url:"http://res.cloudinary.com/iulogy/image/upload/v1367119078/raajje_p8cz4e.png", 
				english:"Raajje",
				type:"News & current affairs"

			},
			"dhitv": {
				name:"dhitv",
				dhivehi:"ދިޓީވީ",  
				image_url:"http://res.cloudinary.com/iulogy/image/upload/v1367119077/dhitv_bs4wix.png", 
				english:"DhiTv",
				type:"News & current affairs"

			},
			"adduonline": {
				name:"adduonline",
				dhivehi:"އައްޑޫ އޮންލައިން",  
				image_url:"http://res.cloudinary.com/iulogy/image/upload/v1367119077/adduonline_eaxmvq.png", 
				english:"Addu Online",
				type:"News & current affairs"

			},
			"newdhivehiobserver": {
				name:"newdhivehiobserver",
				dhivehi:"ނިއު ދިވެހި އޮބްސާވަރ",  
				image_url:"http://res.cloudinary.com/iulogy/image/upload/v1367119079/newdhivehiobserver_qlperc.png", 
				english:"New Dhivehi Observer",
				type:"Amateur news"

			},
			"police": {
				name:"police",
				dhivehi:"ޕޮލިސް",  
				image_url:"http://res.cloudinary.com/iulogy/image/upload/c_crop,g_south_west,h_85,w_87/v1367119079/police_iqklvq.png", 
				english:"Maldives Police Service",
				type:"Institutional news and information"

			},
			"fanvai": {
				name:"fanvai",
				dhivehi:"ފަންވަތް",  
				image_url:"http://res.cloudinary.com/iulogy/image/upload/v1367119078/fanvai_pb7pgq.png", 
				english:"Fanvai",
				type:"Amateur information"

			},
			"dhiislam": {
				name:"dhiislam",
				dhivehi:"ދި އިސްލާމް",  
				image_url:"http://res.cloudinary.com/iulogy/image/upload/v1367119076/dhiislam_ilcd58.png", 
				english:"Dhi Islam",
				type:"News & current affairs"

			},
			"minivannews": {
				name:"minivannews",
				dhivehi:"މިނިވަން",  
				image_url:"http://res.cloudinary.com/iulogy/image/upload/v1367119080/minivannews_zyac0q.png", 
				english:"Minivan News",
				type:"News & current affairs"
			}
		}
		for(var i=0; i<sources.length; i++){
			sources[i] = map[sources[i]];
		}		
		res.json({sources:sources});
	})
})
app.get('/fetch', function(req, res){
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

app.get('/pictures', function(req, res){
	featured.find({})
	.sort({_id:-1})
	.exec(function(err, pics){
		res.json(pics);
	})
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
