(function($) {

  L.Icon.Default.imagePath = '/img/';
  var el, map;

  var methods = {
    addMarkers: function() {

      var streams = $(el).data('locations'),
          markers = new L.MarkerClusterGroup();

      $.each(streams, function(i, v) {

        var marker = L.marker([v.lat, v.lng]);

        marker.bindPopup(
          '<a href="/streams/' + v.publicKey + '">' + v.title + '</a><br>' + v.location
        );

        markers.addLayer(marker);

      });

      map.addLayer(markers);

    }
  };

  $.fn.stream_map = function() {

    el = this.get(0);

    // map init
    map = L.map(el).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    methods.addMarkers();

  };

}(jQuery));

