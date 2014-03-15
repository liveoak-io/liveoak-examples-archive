// for remote access set host to server name:port where the app is deployed
var HOST = '';

var APP_ROOT = '/gallery/';
var DRIVE_ROOT = HOST + APP_ROOT + 'drive/user';

$(".galleria").css('width', window.innerWidth)
    .css('height', window.innerHeight);

Galleria.loadTheme(APP_ROOT + '/app/galleria/themes/classic/galleria.classic.min.js');
Galleria.run('.galleria', {swipe: 'disabled'});

Galleria.ready(function () {
  var G = this;

  var selectCallback = function (e) {
    // FileList object
    var files = e.target.files;

    for (var i = 0, file; file = files[i]; i++) {

      // if not image, skip it
      if (!file.type.match('image.*')) {
        continue;
      }

      var reader = new FileReader();

      // display image file as thumbnail when done loading it
      reader.onload = function (e) {
        // add thumbnail
        G.push({ image: e.target.result});
      };
      // start loading the file for display
      reader.readAsDataURL(file);

      // also start uploading the file
      upload(fileId(file), file);
    }
  };

  var request = function (method, url, blob, success, error) {
    var req = new XMLHttpRequest();
    req.open(method, url, true);

    if (blob) {
      req.setRequestHeader('Content-type', blob.type);
    }
    req.setRequestHeader('Accept', 'application/json');

    //if (window.oauth.token) {
    //  req.setRequestHeader('Authorization', 'bearer ' + window.oauth.token);
    //}

    req.onreadystatechange = function () {
      if (req.readyState == 4) {
        if (req.status == 200 || req.status == 201) {
          if (success) {
            var response;
            if (req.responseText) {
              response = JSON.parse(req.responseText);
            } else {
              response = {};
            }
            success(response);
          }
        } else {
          if (error) {
            var response = { status: req.status, statusText: req.statusText };
            if (req.responseText) {
              response.data = JSON.parse(req.responseText);
            }
            error(response);
          }
        }
      }
    }

    if (blob) {
      req.send(blob);
    } else {
      req.send();
    }
  }

  var logCallback = function (msg) {
    console.log(msg);
  }

  var upload = function (id, file, success, error) {
    request('PUT', DRIVE_ROOT + '/' + id, file, success ? success : logCallback, error ? error : logCallback);
  }

  var fileId = function (file) {
    return formatDate(new Date()) + '_' + file.name;
  };

  var formatDate = function (date) {
    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    if (month < 10) {
      month = '0' + month;
    }
    var day = date.getDate();
    if (day < 10) {
      day = '0' + day;
    }

    return year + month + day;
  };


  // add plus button
  var plusBtn = $('<div class="galleria-image-add"></div>');
  plusBtn.css('left', window.innerWidth - 50 + 'px');
  plusBtn.insertAfter($('.galleria-thumbnails-container'));

  var uploadBtn = $('<input type="file" class="file-input" id="files" name="files[]" multiple />');
  plusBtn.append(uploadBtn);

  plusBtn.click(function () {
    console.log('Clicked !');
  });

  //uploadBtn.change(selectCallback, false);  // why doesn't this work?
  document.getElementById('files').addEventListener('change', selectCallback, false);


  // get current list of files from gridfs
  request('GET', DRIVE_ROOT + '?fields=*(*)', null, function (response) {
    var items = response._members || [];
    items.forEach(function (item) {
      // add thumbnail
      G.push({ image: DRIVE_ROOT + '/' + item.filename});
    });
  }, function (error) {
    console.log("error: " + error);
  });
});