(function($) {

  var el,
      alias_timer,
      editing;

  var form = {
    selectLocation: function(e, result) {

      var city = '',
          state = '',
          country = '';

      $.each(result.address_components, function(i, v) {

        if(v.types.indexOf('locality') !== -1) {
          city = v.long_name;
        } else if(v.types.indexOf('administrative_area_level_1') !== -1) {
          state = v.long_name;
        } else if(v.types.indexOf('country') !== -1) {
          country = v.long_name;
        }

      });

      el.find('input[name=location_lat]').val(result.geometry.location.lat());
      el.find('input[name=location_lng]').val(result.geometry.location.lng());
      el.find('input[name=location_city]').val(city);
      el.find('input[name=location_state]').val(state);
      el.find('input[name=location_country]').val(country);

    },
    checkAlias: function(e) {

      var group = $(this).closest('.form-group'),
          val = $(this).val().replace(/\W/g, '').toLowerCase();

      // replace with sanatized val
      $(this).val(val);

      group.find('.alias_example').html(val);

      if(val.length < 1) {
        return;
      }

      if(alias_timer) {
        clearTimeout(alias_timer);
      }

      alias_timer = setTimeout(function(e) {

        var data = { alias: val };

        if(editing) {
          data.pub = el.data('public');
        }

        $.get('/streams/check_alias', data, function(data) {

          if(data.exists) {
            group.addClass('has-error');
            group.removeClass('has-success');
            return;
          }

          group.addClass('has-success');
          group.removeClass('has-error');

        });

      }, 350);

    },
    edit: function() {

      el.find('input[name=fields]').closest('.form-group').click(function(e) {
        $('#field_warning').show();
      });

      $('#edit_stream').on('click', function(e) {
        e.preventDefault();
        $('.manage-controls').hide();
        $('.edit-container').show();
      });
      $('#clear_stream').on('click', form.clearPrompt);
      $('#delete_stream').on('click', form.deletePrompt);

      el.submit(this.checkForChangedFields);

    },
    checkForChangedFields: function(e) {

      var f = this;

      e.preventDefault();

      if(el.find('input[name=fields]').val().trim() === el.find('input[name=field_check]').val().trim()) {
        f.submit();
        return;
      }

      var cb = form.clearStream.bind(this, function(response) {
        f.submit();
      });

      bootbox.confirm('You have changed the field definitions, and must clear your stream data to save the new definition. Are you sure you want to continue?', cb);

    },

    clearPrompt: function(e) {

      e.preventDefault();

      var button = $(this);

      var cb = form.clearStream.bind(this, function(response) {

        if(!response.success) {
          button.html('Failed.');
        }

        window.location = '/streams/' + el.data('public');

      });

      bootbox.confirm('Are you sure you want to clear all data from this stream?', cb);

    },

    deletePrompt: function(e) {

      e.preventDefault();

      var cb = function(cb, result) {

        if(!result) {
          return;
        }

        window.location = '/streams/' + el.data('public') + '/delete/' + result;

      };

      bootbox.prompt('Please enter your delete key to delete this stream.', cb);

    },

    clearStream: function(cb, result) {

      if(!result) {
        return;
      }

      $.ajax({
        url: '/input/' + el.data('public') + '/clear.json',
        type: 'POST',
        headers: {
          'Phant-Private-Key': el.data('private')
        },
        success: cb
      });

    }

  };

  $.fn.streamForm = function() {

    el = $(this);
    editing = (el.data('public') ? true : false);

    if(editing) {
      form.edit();
    }

    el.on('keyup', 'input[name=alias]', form.checkAlias);

    el.find('input[name=fields]').tagsinput({
      maxTags: 30,
      trimValue: true,
      confirmKeys: [13, 44, 32]
    });

    el.find('input[name=tags]').tagsinput({
      maxTags: 15,
      trimValue: true,
      confirmKeys: [13, 44, 32]
    });

    el.find('input[name=tags], input[name=fields]').on('beforeItemAdd', function(e) {
      e.item = e.item.replace(/\W/g, '').toLowerCase();
    });

    el.find('input[name=location_long]')
      .geocomplete()
      .bind('geocode:result', form.selectLocation);

  };

}(jQuery));

