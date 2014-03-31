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
        resize(e.target.result, function(dataUrl) {
          G.push({ image: dataUrl});
        });
      };
      // start loading the file for display
      reader.readAsDataURL(file);

      // also start uploading the file
      upload(fileId(file), file);
    }
  };

  var resize = function (dataUrl, callback) {
    // resize image
    var tmpImg = new Image();
    tmpImg.src = dataUrl;
    tmpImg.onload = function() {
      var w = tmpImg.width;
      var h = tmpImg.height;

      var maxW = 1024;
      var maxH = 800;

      if (w > h) {
        if (w > maxW) {
          h *= maxW / w;
          w = maxW;
        }
      } else {
        if (h > maxH) {
          w *= maxH / h;
          h = maxH;
        }
      }

      if (w < tmpImg.width) {
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(tmpImg, 0, 0, w, h);
        callback(canvas.toDataURL("image/jpeg"));
      } else {
        callback(dataUrl);
      }
    }
  }

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
    return date.getFullYear()
        + format00(date.getMonth() + 1)
        + format00(date.getDate())
        + format00(date.getHours())
        + format00(date.getMinutes())
        + format00(date.getSeconds());
  };

  var format00 = function (val) {
    if (val < 10) {
      val = '0' + val;
    }
    return '' + val;
  }

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
      resize(DRIVE_ROOT + '/' + item.filename, function(dataUrl) {
        G.push({ image: dataUrl});
      });
    });
  }, function (error) {
    console.log("error: " + error);
  });
});