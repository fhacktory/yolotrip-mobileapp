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
    var Map = require('ti.map');
    var win = $.index;
    var width = win.width;
    var height = win.height;
    var roadTrip = null;

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
                callback(false);
                return;
            }
    
            callback({
                latitude: e.coords.latitude,
                longitude: e.coords.longitude
            });
        });
    };
    
    
    // Textfield
    var noteHintText = 'Add a note with your photo...';
    $.message.value = noteHintText;
    $.message.addEventListener('focus', function(e) {
        Ti.API.info([noteHintText, this.value]);
        if ( this.value == noteHintText ) {
            this.value = '';
        }
    });
     
    $.message.addEventListener('blur', function(e) {
        if (this.value == '') this.value = noteHintText;
    });
    
    // Map
    var map = Map.createView({
        mapType: Map.NORMAL_TYPE,
        animate:true,
        regionFit:true,
        userLocation:true
    });
    map.addEventListener('complete', function(e) {
        geolocateMe(function(coords) {
            map.setLocation({
                latitude : coords.latitude,
                longitude : coords.longitude,
                latitudeDelta : 0.01,
                longitudeDelta : 0.01,
                animate: true
            });
        });
    });
    $.mapview.add(map);
    
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
    
    // Take and upload a photo
    var takeAndUploadPhoto = function(message) {
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
                    media : smallImage ? smallImage : imageBlob
                });
            } catch (e) {
                Ti.API.info(e);
            }
        }).then(function(photoUploaded) {
            geolocateMe(function(coords) {
                if (coords) {
                    // Create Location on parse
                    var location = new Parse.Object("Location");
                    location.set('coordinates', new Parse.GeoPoint({
                        latitude: coords.latitude,
                        longitude: coords.longitude
                    }));
                    location.set('photosArray', [photoUploaded.model]);
                    
                    if (message) {
                        location.set('messages', [message]);
                    }
                    
                    location.relation('roadtrip').add(roadTrip); // TODO Wait for roadtrip fetch
                    location.save().then(function(location) {
                        alert('Votre roadtrip à été mis à jour !');
                        $.message.value = '';
                    }, function(error) {
                        Ti.API.info(error);
                    });
                }
            });
        });
    };
    
    // Update my trip
    $.updateMyTrip.addEventListener('click', function(e) {
        var messageTxt = $.message.value;
        if (messageTxt && messageTxt != noteHintText) {
            var message = new Parse.Object("Message");
            message.set('Message', messageTxt);
            message.save().then(function(messageSaved){
                takeAndUploadPhoto(messageSaved);
            });
        } else {
            takeAndUploadPhoto();
        }
    });
    
    $.index.open();
};