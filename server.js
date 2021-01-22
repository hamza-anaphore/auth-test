'use strict';
const express = require('express');
const session = require('express-session');
const app = express();
var path = require('path');
const port = 3030 ;
const fs = require('fs');
var proxy = require('express-http-proxy');
var httpProxy = require('http-proxy');
var apiProxy = httpProxy.createProxyServer();
const { createProxyMiddleware } = require('http-proxy-middleware');

var obj1 = JSON.stringify(JSON.parse(fs.readFileSync('manifest/canvas1.json', 'utf8')), null, "  ");
var obj2 = JSON.parse(fs.readFileSync('manifest/canvas2.json', 'utf8'));
var obj3 = JSON.parse(fs.readFileSync('manifest/canvas3.json', 'utf8'));

  
const jsonPlaceholderProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  logLevel: 'debug',
});

//app.use('/', jsonPlaceholderProxy);

//app.use('/', proxy('http://localhost:3000/'));
//var test = createProxyMiddleware('/manifest',{ target: 'http://localhost:3000/', changeOrigin: true });

//app.use(test)


app.get('/', (req, res) => {
  res.send('<h3>  MIRADOR VIEWER </h3>');
})



//app.use('/manifest', proxy('http://localhost:3000/'));
//app.get('/manifest/:id', proxy('http://localhost:3000/ARK-12345/:id'));
//app.use('/manifest/:manifestid/:id', proxy('http://localhost:3000/ARK-12345/:id/:canvasid'));*/




app.get('/auth/login/', function (req, res) {
  res.sendFile(__dirname + '/template/file.html');
});

app.get('/auth/external', function (req, res) {
  res.sendFile(__dirname + '/template/external.html');
});

app.get('/file', function (req, res) {
  res.sendFile(__dirname + '/template/file.html');
});

app.get('/home', function (req, res) {
  res.sendFile(__dirname + '/template/home.html');
  
});


app.use('/img/02/info.json',(req, res, next) => {
      //res.send(obj2);
      res.redirect('http://localhost:8182/iiif/2/orca.png/info.json');
      
})

app.use('/iiif/2/:identifiant/full/1000,/0/default.png',(req, res, next) => {
  //res.send(obj2);
  res.redirect('http://localhost:8182/iiif/2/tigre.jpg/full/1000,/0/default.png');
  
})

app.use('/img/:id/info.json',(req, res, next) => {

    
        if(req.params.id == 1){
            res.redirect('http://localhost:8182/iiif/2/tigre.jpg/info.json');
            //res.send(obj1);
        } else if(req.params.id == 2) {
          res.redirect('/file');
          
        }
        else {
            //res.send(obj3)
            res.redirect('http://localhost:8182/iiif/2/lion.jpg/info.json');
        }
        console.log("here : "+req.params.id+" methode : "+req.method)
        
        next();
})

app.use('/manifest/:manifestid/:id',(req, res, next) => {

    
  console.log('here hello 11------------- id : '+req.params.id)
    
  if(req.params.id == 1){
      res.send(obj1);
  } else if(req.params.id == 2) {
    console.log('here hello 22------------- id : '+req.params.id)
    res.redirect('/file');
  }
  else {
      res.send(obj3)
  }
  console.log("here : "+req.params.id+" methode : "+req.method)
  
  next();
})










app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })