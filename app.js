var express = require('express');
var search = require('bing.search');
var path = require('path');

var bing = new search('kiEVvBekCoCgw0xIIZSuw2nhQzQrbbl/vCn8LsKj7Bs');
var util = require('util');
var mongod = require('mongodb').MongoClient;
var url_db = process.env.DB_URI;
var maxResult = 10;

var app = express();

app.get('/api/imagesearch/:term', function(req, res){
    var searchTerm = req.params.term;
    var offset = Number(req.query.offset);
    console.log(searchTerm, offset);
    bing.images(searchTerm, {top:20+offset}, function(err, results){
        if(err) return res.json(err);
        var resultsArr = [];
        results = results.slice(offset);
        results.forEach(function(item){
            resultsArr.push({
                "url": item.url,
                "snippet": item.title,
                "thumbnail": item.thumbnail.url,
                "context": item.sourceUrl
            })
        });
        connectDB(function(db, col){
           col.insert({'term':searchTerm, 'time': new Date()});
           db.close();
        });
        res.json(resultsArr);
    });
});

app.get('/api/latest/imagesearch/', function(req, res){
    connectDB(function(db, col){
       col.find({}, {_id:0, term:1, time:1}).sort({time:-1}).toArray(function(err, results){
           if(err) throw err;
           results = results.slice(0, maxResult+1);
           res.json(results);
       })
       db.close();    
    });
});

app.get('/', function(req,res){
   res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(process.env.PORT || 8080, function(){});

function connectDB(callback){
    mongod.connect(url_db, function(err, db){
        if(err) throw err
        var col = db.collection('searches');
        callback(db, col);
    })
}