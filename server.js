var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var ip = process.env.IP || '127.0.0.1';
var validator = require('validator');
var mongoose = require('mongoose');
var mySite = ('https://fcc-little-url-fourbits.c9users.io/');


function generateUrl() {
  // 16777215 unique URLs should be enough for this exercise!
  return Math.floor(Math.random() * 16777215).toString(16).toLowerCase();
}

function urlExists(url, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]['short_url'] == url) {
      return true;
    }
  }
  return false;
}

// set up schemas and models
var linkSchema = mongoose.Schema({
  'original_url': String,
  'short_url': String
});
var Link = mongoose.model('Link', linkSchema);



// connect to DB
mongoose.connect('mongodb://localhost/urlDB');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log('connected to mongodb');


  // default to explanation page (public/index.html)
  app.use(express.static('public'));

  // new/URL accepts a URL and returns a shortened one
  app.get('/new/*', function(req, res) {
    res.append('Content-Type', 'application/json');

    var url = req.params[0];

    console.log('Received request: ' + url);
    if (validator.isURL(url)) {
      // prepend 'http://' if no protocol is given
      if (url.indexOf('://') == -1) {
        url = 'http://' + url;
      }
      // check if url already in DB
      var query = Link.where({
        'original_url': url
      });
      query.findOne(function(err, link) {
        if (err) {
          res.send({
            'error': 'Unable to read link DB'
          });
          return console.log(err);

        }
        // if in DB, return it
        if (link) {
          res.send({
            'original_url': link['original_url'],
            'short_url': mySite + link['short_url']
          });
        }
        else {
          // otherwise, generate a new short url
          // list all existing links
          Link.find(function(err, links) {
            if (err) {
              res.send({
                'error': 'Unable to read link DB'
              });
              return console.log(err);
            }

            // keep generating random hex strings until
            //   a unique one is found
            var shortUrl = generateUrl();
            while (urlExists(shortUrl, links)) {
              shortUrl = generateUrl();
            }
            // save the new link
            link = new Link({
              'original_url': url,
              'short_url': shortUrl
            });
            link.save(function(err, link) {
              if (err) {
                res.send({
                  'error': 'Unable to save new link!'
                });
                return console.log(err);
              }
              res.send({
                'original_url': link['original_url'],
                'short_url': mySite + link['short_url']
              });
            });
          });

        }
      });
    }
    else {
      console.log('Invalid URL!');
      res.send({
        'error': 'Invalid URL'
      });
    }
  });

  // redirect links ending with up to six hexadecimal digits
  app.get(/\/[A-Fa-f0-9]{1,6}$/, function(req, res) {
    console.log('Received a shortened url:' + req.url);

    var url = req.url.substr(1).toLowerCase(); // remove the leading slash

    var query = Link.where({
      'short_url': url
    });
    query.findOne(function(err, link) {
      if (err) {
        res.send('Error: Unable to read link DB');
        return console.log(err);
      }
      if (link) {
        console.log('Redirecting to: ' + link['original_url']);
        res.redirect(link['original_url']);
      }
      else {
        console.log('Could not find it!');
        res.send('Error: No such link in DB');
      }
    });
  });

  app.listen(port, ip);
});
