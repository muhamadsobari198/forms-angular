/**
 * Module dependencies.
 */

var express = require('express')
    , fs = require('fs')
    , mongoose = require('mongoose')
    , exec = require('child_process').exec
    , https = require('https');


var app = module.exports = express();

// Configuration

app.configure(function(){
//    app.use(express.logger('dev'));
    app.use(express.bodyParser({
        uploadDir: __dirname + '/../app/tmp',
        keepExtensions: true
    }));
    app.get('*',handleCrawlers);
    app.use(express.methodOverride());
    app.use(app.router);
    if (app.get('env')==='production') app.use(express.static(__dirname + '/../dist'));
    console.log(__dirname + '/../app');
    app.use(express.static(__dirname + '/../app'));

    // Copy the schemas to somewhere they can be served
    exec('cp '+__dirname+'/../server/models/* '+__dirname+'/../app/code/',
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('Error copying models : ' + error + ' (Code = ' + error.code + '    ' + error.signal + ') : ' + stderr + ' : ' + stdout);
            }
        });
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    mongoose.connect('mongodb://localhost/forms-ng_dev');
});

app.configure('test', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    mongoose.connect('mongodb://localhost/forms-ng_test');

    var data_path = __dirname + '/../test/e2edata';
    var data_files = fs.readdirSync(data_path);
    data_files.forEach(function(file){
        var fname = data_path+'/'+file;
        if (fs.statSync(fname).isFile()) {
            exec('mongoimport --db forms-ng_test --drop --collection '+ file.slice(0,1)+'s --jsonArray < ' + fname,
                function (error, stdout, stderr) {
                    if (error !== null) {
                        console.log('Error importing models : ' + error + ' (Code = ' + error.code + '    ' + error.signal + ') : ' + stderr + ' : ' + stdout);
                    }
                });
        }
    });
});

app.configure('production', function(){
    console.log('Production mode');
    app.use(express.errorHandler());
    mongoose.connect(process.env['DEMODB']);
});

var ensureAuthenticated = function (req, res, next) {
    // Here you can do authentication using things like
    //      req.ip
    //      req.route
    //      req.url
    if (true) { return next(); }
    res.status(401).send('No Authentication Provided');
};

function handleCrawlers(req,res,next) {
    if (req.url.slice(0,22) === '/?_escaped_fragment_=/') {
        fs.readFile(__dirname + '/seo/' + req.url.slice(22), 'utf8', function (err,data) {
            if (err) {
                res.send(403,'Not crawlable');
            } else {
                res.send(200, data);
            }
        });
    } else {
        next();
    }
}

//// Bootstrap models
var DataFormHandler = new (require(__dirname + '/lib/data_form.js'))(app, {urlPrefix : '/api/'});
// Or if you want to do some form of authentication...
// var DataFormHandler = new (require(__dirname + '/lib/data_form.js'))(app, {urlPrefix : '/api/', authentication : ensureAuthenticated});

var models_path = __dirname + '/models';
var models_files = fs.readdirSync(models_path);
models_files.forEach(function(file){
    var fname = models_path+'/'+file;
    if (fs.statSync(fname).isFile()) {
        DataFormHandler.addResource(file.slice(0,-3), require(fname));
    }
});

// If you want to use HTML5Mode uncomment the section below and modify
// app/demo.js so that the call to urlService.setOptions includes {html5Mode: true}

//app.configure(function() {
//    // Serve the static files.  This kludge is to support dev and production mode - for a better way to do it see
//    // https://github.com/angular-ui/ui-router/wiki/Frequently-Asked-Questions#how-to-configure-your-server-to-work-with-html5mode
//    app.get(/^\/(scripts|partials|bower_components|demo|img|js)\/(.+)$/,function(req,res,next) {
//        fs.realpath(__dirname + '/../app/' + req.params[0] + '/' + req.params[1], function (err, result) {
//            if (err) {
//                fs.realpath(__dirname + '/../dist/' + req.params[0] + '/' + req.params[1], function (err, result) {
//                    if (err) {
//                        throw err;
//                    } else {
//                        res.sendfile(result);
//                    }
//                });
//            } else {
//                res.sendfile(result);
//            }
//        });
//    });
//    app.all('/*', function(req, res, next) {
//        // Just send the index.html for other files to support HTML5Mode
//        res.sendfile('index.html', { root: __dirname + '/../app/' });
//    });
//});

var port;

port = process.env.PORT || 3001 ;
app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);
