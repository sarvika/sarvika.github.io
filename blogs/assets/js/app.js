var blogsMeta = {};
var b4gCache = {desc:[], blogs:[]};

const classMap = {
  table: 'table table-striped',
  blockquote: 'blockquote bg-teal',
  h1: 'ct-page-title',
  h2: 'anchorjs-link'
}

const bindings = Object.keys(classMap)
  .map(key => ({
    type: 'output',
    regex: new RegExp(`<${key}(.*)>`, 'g'),
    replace: `<${key} class="${classMap[key]}" $1>`
  }));

var showdownConverter = new showdown.Converter({'tables': true, 'flavor': 'github', extensions: [...bindings]});

$(document).ready(function(){
  $.ajax('./posts/blogs.json', {
    dataType: 'json',
    success: function(data) {
        blogsMeta = processBlogMetadata(data);

        onHashChange();
        renderMustache('featured-blog-mustache', blogsMeta, 'b4g-blogs-featured');
    }
  });
});

var renderMainContent = function() {
  renderMustache('section-blog-listing', {}, 'b4g-section-main');
  renderMustache('blog-listing-mustache', blogsMeta, 'b4g-blogs-all');

  $('p[data-type="b4g-data-shortdesc"]').each(function(i, el) {
    var _this = $(el);
    var id = _this.attr('data-id');
    var cache = b4gCache.desc[id + ''];

    if (cache != undefined) {
      _this.html(cache);
    } else {
      prepareBlogCache(id);
      _this.html(b4gCache.desc[id + '']);
    }
  });
}

var prepareBlogCache = function(id) {
  $.ajax('./posts/' + id + '.md', {
    type: 'GET',
    async: false,
    success: function(data) {
      if (data != '') {
        var html = showdownConverter.makeHtml(data);
        b4gCache.blogs[id + ''] = html;
        $(html).each(function(i, e) {
          var _e = $(e);
          if (_e.prop('tagName') === 'P') {
            b4gCache.desc[id + ''] = _e.html();
            return false;
          }
        });
      }
    }
  });
}

var processBlogMetadata = function(meta) {
  var metadata = {all: [], featured: []};
  for (var i = 0 ; i < meta.all.length ; i++) {
    var blogObj = meta.all[i];

    var blog = {id: blogObj.md, title: blogObj.title, create: blogObj.create, time: parseDate(blogObj.create)};
    metadata.all.push(blog);

    if (blogObj.featured == true) metadata.featured.push(blog)
  }

  return metadata;
}

var renderMustache = function(mustache, object, id) {
  var rendered = Mustache.render($('#' + mustache).html(), object);
  $('#' + id).html(rendered);
}

var parseDate = function(d) {
  var date = new Date(Date.parse(d));
  var diff = new Date() - date;

  var msec = diff;
  var hh = Math.floor(msec / 1000 / 60 / 60);
  msec -= hh * 1000 * 60 * 60;
  var mm = Math.floor(msec / 1000 / 60);
  msec -= mm * 1000 * 60;
  var ss = Math.floor(msec / 1000);
  msec -= ss * 1000;

  return {h: hh, m: mm, s: ss};
}

var b4ghome = function() {
  window.location.replace("#");
}

var onHashChange = function() {
  var id = window.location.hash.replace(/#/g, '');
  var file = id + '.md';
  if (file == '.md') {
    document.title = blogTitle;
    renderMainContent();
  } else {
    for (var i = 0 ; i < blogsMeta.all.length ; i++) {
      if (blogsMeta.all[i].id == id) {
        document.title = blogsMeta.all[i].title;
        break;
      }
    }
    if (b4gCache.blogs[id + ''] == undefined) prepareBlogCache(id);
    $('#b4g-section-main').html(b4gCache.blogs[id + '']);
  }
  hljs.initHighlighting.called = false;
  hljs.initHighlighting();
}
