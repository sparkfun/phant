(function($) {

  var templates = {},
      config = {};

  config.loadTemplates = function(el) {

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

  config.fillDropdowns = function(el) {

    var types = ['input', 'output', 'stream', 'meta', 'manager', 'keychain'];

    $.each(el.data('packages'), function(i, p) {

      var type = p.name.split('-')[1],
          option;

      if(! p.phantConfig) {
        return;
      }

      if(types.indexOf(type) === -1) {
        return;
      }

      option = $(templates.option(p));
      option.data('type', type);
      option.data('package', p);
      el.find('.' + type + ' ul.dropdown-menu').append(option);

    });

  };

  config.selectOption = function(e) {

    var selected = $(this),
        conf = selected.data('package'),
        type = selected.data('type'),
        exists = false;

    e.preventDefault();

    // check for existing copies of the module
    $('.panel').each(function() {
      if($(this).data('package').name === conf.name) {
        exists = true;
      }
    });

    if(exists) {
      return bootbox.alert('A configuration for this module already has been added.');
    }

    if(type !== 'meta' && type !== 'keychain')  {
      $('.' + type + 's').append(config.buildContainer(type, conf));
    } else {
      $('.' + type + 's').html(config.buildContainer(type, conf));
    }

  };

  config.addDefaults = function(el) {

    var packages = el.data('packages');

    $('.inputs').html(this.buildContainer('input', packages['phant-input-http']));
    $('.outputs').html(this.buildContainer('output', packages['phant-output-http']));
    $('.streams').html(this.buildContainer('storage', packages['phant-stream-csv']));
    $('.managers').html(this.buildContainer('manager', packages['phant-manager-telnet']));
    $('.metas').html(this.buildContainer('meta', packages['phant-meta-nedb']));
    $('.keychains').html(this.buildContainer('keychain', packages['phant-keychain-hex']));

    $('.spinner').hide();

  };

  config.buildContainer = function(type, package) {

    var form = '';

    if(package.phantConfig.http) {
      form += templates.input({
        type: 'number',
        label: 'Port',
        name: 'http_port',
        default: '8080',
        description: 'The TCP port to use for the http server.'
      });
    }

    $.each(package.phantConfig.options, function(i, opt) {

      if(opt.require) {
        form += templates.label(opt);
        return;
      }

      form += templates.input(opt);

    });

    var panel = $(templates.container({
      name: type.charAt(0).toUpperCase() + type.slice(1) + ' - ' + package.phantConfig.name,
      config: form
    }));

    panel.data('package', package);

    return panel;

  };

  config.validate = function(el) {

    var require = {};

    el.find('.panel .require').each(function() {
      require[$(this).data('require')] = true;
    });

    if(el.find('.metas').children().length > 1) {
      throw 'You only need one metadata module. Please remove one.';
    }

    if(el.find('.metas').children().length < 1) {
      throw 'You must select a metadata module.';
    }

    if(el.find('.keychains').children().length > 1) {
      throw 'You only need one keychain module. Please remove one.';
    }

    if(el.find('.keychains').children().length < 1) {
      throw 'You must select a keychain module.';
    }

    if(require.stream) {

      if(el.find('.streams').children().length < 1) {
        throw 'You must select a storage module.';
      }

    }

    if(require.manager) {

      if(el.find('.managers').children().length < 1) {
        throw 'You must select a manager module.';
      }

    }

    el.find('.panel input').each(function() {

      var title = $(this).closest('.panel').find('panel-heading').html();

      title += ' - ' + $(this).closest('.form-group').find('label').html();

      if($(this).val().trim() === '') {
        throw 'Missing: ' + title;
      }

    });

  };

  config.download = function(el) {

    var dl = function(type) {
      $(templates.download({type: type, config: config.get(el)})).submit();
    };

    bootbox.dialog({
      title: 'Download package',
      message: 'Please select an output format.',
      buttons: {
        zip: {
          label: 'zip',
          className: 'btn-success',
          callback: function() {
            dl('zip');
          }
        },
        tar: {
          label: 'tar.gz',
          className: 'btn-danger',
          callback: function() {
            dl('tar');
          }
        }
      }
    });

  };

  config.publish = function(el) {

    bootbox.prompt('Enter the name of your package. It will be published to npm with the prefix of "phantconfig-"', function(result) {

      if(! result) {
        return;
      }

      // remove all non alpha numeric characters, and replace spaces with dashes
      result = result.replace(/\W/g, '').toLowerCase();

      config.message('Checking npm for packages named phantconfig-' + result, true);

      // check npm for package name
      config.checkName(result).then(function(res) {

        // clear message
        config.message();

        // prompt again if the module already exists
        if(res.exists) {
          bootbox.alert('A module named phantconfig-' + result + ' already exists. Please choose another.', function() {
            config.publish(el);
          });
          return;
        }

        config.message('Publishing phantconfig-' + result + ' to npm. You will be redirected to the package once publishing is complete.', true);

        // actually publish the package
        $.post('/config/publish', { name: result, config: config.get(el) }, function(res) {

          if(! res.success) {
            config.message();
            return bootbox.alert(res.message);
          }

          window.location = 'https://npmjs.org/package/phantconfig-' + result;

        });

      });

    });

  };

  config.get = function(el) {

    var cnf = {
      http: false
    };

    cnf.meta = config.parseType(el, 'metas', cnf)[0];
    cnf.keychain = config.parseType(el, 'keychains', cnf)[0];
    cnf.inputs = config.parseType(el, 'inputs', cnf);
    cnf.outputs = config.parseType(el, 'outputs', cnf);
    cnf.streams = config.parseType(el, 'streams', cnf);
    cnf.managers = config.parseType(el, 'managers', cnf);

    return JSON.stringify(cnf);

  };

  config.parseType = function(el, type, cnf) {

    var modules = []

    el.find('.' + type + ' .panel').each(function() {

      var parsed = config.parsePanel($(this)),
          userConfig = parsed.userConfig.slice();

      $.each(userConfig, function(i, v) {
        // set global http port, and clear it from module config
        if(v.name === 'http_port') {
          cnf.http = v.value;
          parsed.userConfig.splice(i, 1);
        }
      });

      modules.push(parsed);

    });

    return modules;

  };

  config.parsePanel = function(el) {

    var package = el.data('package');

    package.userConfig = [];

    // add text inputs
    el.find('input').each(function() {

      var input = $(this);

      if(input.attr('type') === 'number') {
        package.userConfig.push({name: input.attr('name'), value: input.val()});
      } else {
        package.userConfig.push({name: input.attr('name'), value: "'" + input.val() + "'"});
      }

    });

    // add required modules
    $.each(package.phantConfig.options, function(i, v) {

      if(! v.require) {
        return;
      }

      package.userConfig.push({name: v.name, value: v.require});

    });

    return package;

  };

  config.checkName = function(name) {
    return $.get('/config/exists/' + name);
  };

  config.message = function(message, spinner) {

    if(! spinner) {
      $('.spinner').hide();
    } else {
      $('.spinner').show();
    }

    if(! message) {
      $('.modules').each(function(){ $(this).show(); });
      $('.button-container').show();
      $('.controls').show();
      $('#message').html('');
      return;
    }

    $('#message').html(message);
    $('.modules').each(function(){ $(this).hide(); });
    $('.button-container').hide();
    $('.controls').hide();

  }

  $.fn.configurator = function() {

    var promises = config.loadTemplates(this),
        el = this;

    $.when.apply(this, promises).done(function() {
      config.addDefaults(el);
      config.fillDropdowns(el);
    });

    el.on('click', 'ul.dropdown-menu li', config.selectOption);

    el.on('click', '.panel button.close', function(e) {
      $(this).closest('.panel').remove();
    });

    el.on('click', '.validate',  function(e) {

      e.preventDefault();

      try {
        config.validate(el);
        config[$(this).data('action')].call(this, el);
      } catch(err) {
        bootbox.alert(err);
        return;
      }

    });

    // sync http ports between all inputs
    el.on('keyup', '[name=http_port]', function(e) {

      var port = $(this).val();

      e.preventDefault();

      $('[name=http_port]').each(function() {
        $(this).val(port);
      });

    });

  };

}(jQuery));

