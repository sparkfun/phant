# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.hostname = 'phant.dev'
  config.vm.box = "ubuntu/trusty64"

  [8080, 8081].each { |port|
    config.vm.network "forwarded_port", guest: port, host: port
  }

  config.vm.provision "shell", path: "bootstrap.sh"
end
