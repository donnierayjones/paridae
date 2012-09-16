task :package do
  files = [
    'background.html',
    'background.js',
    'icon16.png',
    'icon48.png',
    'icon128.png',
    'jquery.js',
    'manifest.json',
    'script.js',
    'styles.css',
    'underscore.js'
  ]
  filelist = files.join(" ")
  %x[zip package.zip #{filelist}]
end

task :default => :package
