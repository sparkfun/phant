(function($) {

  var templates = {},
      stream = {},
      page = 1;

  stream.loadTemplates = function(el) {

    var promises = [];

    el.find('[type="text/x-handlebars-template"]').each(function(i, v) {

      var url = $(v).attr('src'),
          name = url.match(/([^\/]+)(?=\.\w+$)/)[0];

      promises.push($.get(url, function(data) {
        templates[name] = Handlebars.compile(data);
      }));

    });

    return promises;

  };

  stream.loadData = function(el) {

    var offset = (page - 1) * 100;

    $.get('/output/' + el.data('key') + '.json?offset=' + offset + '&limit=100', function(records) {

      var keys = [],
          values = [],
          head = el.find('table thead'),
          body = el.find('table tbody');

      head.html('');
      body.html('');

      if(! Array.isArray(records)) {
        return;
      }

      if(records.length < 100) {
        el.find('ul.pager').find('li.next').addClass('disabled');
      }

      // sort keys alphabetically
      keys = Object.keys(records[0]).sort();

      records.forEach(function(r) {

        var rec = [];

        // loop through sorted keys, and
        // push sorted values to new array
        keys.forEach(function(k) {
          rec.push(r[k]);
        });

        values.push(rec);

      });

      head.append(templates.header(keys));
      body.append(templates.row({records: values}));
      el.find('.pager').show();

    });

  };

  stream.loadStats = function(el) {

    $.get('/output/' + el.data('key') + '/stats.json', function(stats) {

      var percent = Math.floor((stats.used / stats.cap) * 100),
          cls = 'success',
          cap = (stats.cap / (1024 * 1024)).toFixed(0),
          usedMb = (stats.used / (1024 * 1024)).toFixed(2),
          remainingMb = (stats.remaining / (1024 * 1024)).toFixed(2);

      stream.stats = stats;

      if(percent > 66 && percent < 90) {
        cls = 'warning';
      } else if(percent > 90) {
        cls = 'danger';
      }

      el.find('div.progress-wrapper').html(
        templates.stats({
          percent: percent,
          remainingPercent: Math.round(100-percent),
          cls: cls,
          cap: cap,
          remainingMb: remainingMb,
          usedMb: usedMb
        })
      );

    });

  };

  stream.startMQTT = function(el) {

    var secure = /https/.test(window.location.protocol),
        client = mows.createClient((secure ? 'wss' : 'ws') + '://' + window.location.host),
        body = el.find('table tbody');

    client.subscribe('output/' + el.data('key'));

    client.on('message', function (topic, data) {

      data = JSON.parse(data);

      var keys = Object.keys(data).sort(),
          rec = [];

      // loop through sorted keys, and
      // push sorted values to new array
      keys.forEach(function(k) {
        rec.push(data[k]);
      });

      body.prepend(templates.row({records: [rec]}));

      stream.highlight(body.find('tr').first());

    });

  };

  stream.edit = function(e) {

    var publicKey = $(this).data('public');

    e.preventDefault();

    bootbox.prompt('Please enter the private key for this stream', function(result) {

      if (result === null) {
        return;
      }

      window.location = '/streams/' + publicKey + '/edit/' + result;

    });

  };

  stream.highlight = function(el) {

    var mask = $('<div/>').css({
      position: 'absolute',
      width: el.outerWidth(),
      height: el.outerHeight() + 2,
      top: el.offset().top - 2,
      left: el.offset().left,
      backgroundColor: '#ffff00',
      opacity: 0.4,
      zIndex: 3000
    }).appendTo('body');

    mask.fadeIn('fast').delay(100).fadeOut('slow');

  };

  $.fn.stream = function() {

    var promises = stream.loadTemplates(this),
        el = this;

    $.when.apply(this, promises).done(function() {
      stream.loadStats(el);
      stream.loadData(el);
      stream.startMQTT(el);
    });

    $('#edit_stream').click(stream.edit);

    this.find('ul.pager li').click(function(e) {

      e.preventDefault();

      var requested = parseInt($(this).data('page')),
          next = $(this).closest('ul.pager').find('li.next'),
          previous = $(this).closest('ul.pager').find('li.previous');

      if($(this).hasClass('disabled')) {
        return;
      }

      if(requested > 0) {
        page = requested;
      } else {
        page = 1;
      }

      next.removeClass('disabled');
      next.data('page', page + 1);
      previous.removeClass('disabled');
      previous.data('page', page - 1);

      if(page - 1 < 1) {
        previous.addClass('disabled');
      }

      stream.loadData(el);

    });

  };

}(jQuery));
