 require('ti.parse_mine')(Alloy.CFG.parseOptions);
 
// Login
var defaultUser = {
    username: 'Chupee',
    password: 'fhacktory'
};
$.login = Alloy.createWidget('com.appcelerator.login');
$.login.usernameTxt.value = defaultUser.username;
$.login.passwordTxt.value = defaultUser.password;
$.login.init({
    loginCallback: function(credentials) {
        // Try user login
        Parse.User.logIn(credentials.username, credentials.password,
            {
                success: function(user) {
                    Ti.API.info('User connected');
                    $.login.close();
                    showMainScreen();
                },
                error: function(user, error) {
                    alert("Unable to log in: " + error.code + " " + error.message);
                }
            }
        );
    }
});
$.login.open();

// Main screen
var showMainScreen = function() {
    var win = $.index;
    var width = win.width;
    var height = win.height;
    var roadTrip = null;
    
    // Get roadtrip of user
    var roadTripClass = Parse.Object.extend("Roadtrip");
    var query = new Parse.Query(roadTripClass);
    query.find({
        success: function(results) {
            roadTrip = results[0];
            $.title.text = roadTrip.get('title');
        },
        error: function(error) {
            alert('No roadtrip found');
        }
    });

    // Geoloc user
    var geolocateMe = function(callback) {
        Ti.Geolocation.accuracy = Titanium.Geolocation.ACCURACY_BEST;
        Ti.Geolocation.preferredProvider = "gps";
        Ti.Geolocation.purpose = "Get position to update roadtrip";
        Titanium.Geolocation.getCurrentPosition(function(e)
        {
            if (e.error)
            {
                Ti.API.info(e.error);
                alert('Can\'t geoloc you');
                callback(false);
                return;
            }
    
            callback({
                latitude: e.coords.latitude,
                longitude: e.coords.longitude
            });
        });
    };
    
    // Take and upload a photo
    var takeAndUploadPhoto = function(location) {
        require('cameraService').getPhoto().then(function(_response) {
            try {
                var imageBlob = _response.media;
                var smallImage = null;
                var heightOfImage = imageBlob.height;  
                var widthOfImage = imageBlob.width;
                var aspectRatio =  heightOfImage / widthOfImage;
                
                if (widthOfImage > 640) {
                    var newWidth = 640;
                    var newHeight = newWidth*aspectRatio;
                    
                    Ti.API.info('Resizing image from ' + widthOfImage + ', ' + heightOfImage + ' to ' + newWidth + ', ' + newHeight);
                    smallImage = imageBlob.imageAsResized(newWidth, newHeight);
                }
                
                return require('photoService').savePhoto({
                    media : smallImage ? smallImage : imageBlob,
                    location : location
                });
            } catch (e) {
                Ti.API.info(e);
            }
        }).then(function(_saveResult) {
          Ti.API.info(JSON.stringify(_saveResult, null, 2));
          alert('Image uploaded');
        }, function(_error) {
            Ti.API.info(_error);
        });
    };
    
    // Update my trip
    $.updateMyTrip.addEventListener('click', function(e) {
        geolocateMe(function(coords) {
            if (coords) {
                // Create Location on parse
                var location = new Parse.Object("Location");
                location.set('coordinates', new Parse.GeoPoint({
                    latitude: coords.latitude,
                    longitude: coords.longitude
                }));
                location.relation('roadtrip').add(roadTrip); // TODO Wait for roadtrip fetch
                location.save().then(function(location) {
                    takeAndUploadPhoto(location);
                }, function(error) {
                    Ti.API.info(error);
                });
            }
        });
    });
    
    $.openMap.addEventListener('click', function(e) {
        var mapController = Alloy.createController('map').getView();
        mapController.open({modal:true});
    });
    
    Ti.App.addEventListener('app:uploadingPhoto', function(e) {
        var dialog = Ti.UI.createAlertDialog({
            cancel: 1,
            title: 'Add a note with your photo ',
            style: Ti.UI.iPhone.AlertDialogStyle.PLAIN_TEXT_INPUT,
            buttonNames: ['Save', 'Cancel']
        });
        dialog.addEventListener('click', function(e) {
            Ti.API.info(e);
            if (e.index = 0) {
                var message = new Parse.Object("Message");
                message.relation('location').add(e.location);
                message.save().then(function(location) {
                    Ti.API.info('Message sauvegardé');
                }, function(error) {
                    Ti.API.info(error);
                });
            }
        });
        dialog.show();
    });
    
    Ti.App.fireEvent('app:uploadingPhoto', {});
    
    $.index.open();
};