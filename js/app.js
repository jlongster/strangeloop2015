
function makeNucleus(scene, pos) {
  var nucleusSize = 60;
  var geometry = new THREE.SphereGeometry(nucleusSize, 20, 20);
  var material = new THREE.MeshLambertMaterial({ color: 0xe55ba1,
                                                 specular: 0x555555,
                                                 shininess: 0,
                                                 shading: THREE.FlatShading,
                                                 transparent: true });
  var nucleus = new THREE.Mesh( geometry, material );
  nucleus.name = 'nucleus5';
  if(pos) {
    nucleus.position.x = pos.x;
    nucleus.position.y = pos.y;
    nucleus.position.z = pos.z;
  }

  var geometry = new THREE.TextGeometry("State", { size: 20, height: 0 });
  var material = new THREE.MeshBasicMaterial({ color: "white",
                                               transparent: true });
  var label = new THREE.Mesh(geometry, material);
  label.position.x = -33;
  label.position.y = -9;
  label.position.z = 100;
  nucleus.add(label);

  var electrons = [];
  for(var i=0; i<10; i++) {
    var color = Math.random() < .5 ? 0x6da067 : 0x68739e;
    var geometry = new THREE.SphereGeometry(10 + Math.random() * 5, 12, 12);
    var material = new THREE.MeshLambertMaterial({ color: color,
                                                   specular: 0x555555,
                                                   shininess: 0,
                                                   shading: THREE.FlatShading,
                                                   transparent: true });
    var electron = new THREE.Mesh(geometry, material);
    var angle = Math.random() * Math.PI * 2;
    var dist = Math.random() * 10 + 60;
    electron.position.x = Math.sin(angle) * (nucleusSize + dist);
    electron.position.y = Math.cos(angle) * (nucleusSize + dist);
    electron.position.z = 0;

    var center = new THREE.Object3D();
    center.isElectron = true;
    var axis = new THREE.Vector3(electron.position.x,
                                 electron.position.y,
                                 0);
    center.rotAxis = axis.normalize().applyAxisAngle(
      new THREE.Vector3(0, 0, 1), Math.PI / 2
    );
    center.rotSpeed = Math.random() * .8 + .5;
    center.rotateOnAxis(center.rotAxis, Math.random() * Math.PI * 2);
    center.add(electron);
    nucleus.add(center);
  }

  scene.add(nucleus);
  return nucleus;
}

var lastTime = 0;
function _render(time, renderer, scene, camera, nucleus) {
  var dt = (time - lastTime) / 1000;
  lastTime = time;
  if(nucleus.animate) {
    scene.traverse(function(obj) {
      if(obj.isElectron) {
        obj.rotateOnAxis(obj.rotAxis, obj.rotSpeed * dt);
      }
    });
  }

  renderer.render(scene, camera);

  TWEEN.update(time);

  if(!gDone) {
    requestAnimationFrame(function(time) {
      _render(time, renderer, scene, camera, nucleus)
    });
  }
}

function render(renderer, scene, camera, nucleus) {
  _render(0, renderer, scene, camera, nucleus);
}

function step(scene) {
  var nucleus = scene.getObjectByName('nucleus5');
  gAnimating = true;
  new TWEEN.Tween({ scale: 1, x: 0, textOpacity: 1 })
    .to({ scale: .5, x: -200, textOpacity: 0 }, 1000)
    .easing(TWEEN.Easing.Elastic.InOut)
    .onUpdate(function() {
      nucleus.scale.x = nucleus.scale.y = nucleus.scale.z = this.scale;
      nucleus.position.x = this.x;
      nucleus.children[0].material.opacity = this.textOpacity;
    })
    .onComplete(function() {
      gAnimating = false;
    })
    .start();
}

function copy(scene) {
  var nucleus = scene.getObjectByName('nucleus5');
  gAnimating = true;

  function _copy(i) {
    setTimeout(function() {
      var n = nucleus.clone();
      n.traverse(function(o) {
        if(o.material) {
          o.material = o.material.clone();
        }
      });
      n.name = 'nucleus' + i;
      scene.add(n);
      nucleus.position.x += 80;
      if(i < 4) {
        _copy(i + 1);
      }
      else {
        nucleus.animate = false;
        gAnimating = false;
      }
    }, 300);
  }

  _copy(0);
  document.querySelector('h3.label').innerHTML = 'Time &rarr;';
}

var currentNucleus = 6;
function _show(scene, i) {
  for(var i=0; i<=5; i++) {
    var obj = scene.getObjectByName('nucleus' + i);
    var opacity = (currentNucleus === i) ? .9 : .2;
    obj.traverse(function(o) {
      if(o.material &&
         o.material.opacity &&
         o.material.opacity > 0) {
        if(currentNucleus === i) {
          o.material.opacity = .9;
          o.material.depthTest = false;
        }
        else {
          o.material.opacity = .2;
          o.material.depthTest = true;
        }
      }
    });
  }

  document.querySelector('h3.label').innerHTML = 'T<sub>' + (currentNucleus + 1) + '</sub>';
}

function goBack(scene) {
  currentNucleus = Math.max(currentNucleus - 1, 0);
  _show(scene, currentNucleus);
}

function goForward(scene) {
  currentNucleus = Math.min(currentNucleus + 1, 5);
  _show(scene, currentNucleus);
}

function goTo(i, scene) {
  currentNucleus = Math.max(Math.min(i, 5), 0);
  _show(scene, currentNucleus);
}

var gDone = false;
var gScene = null;
var gAnimating = false;
function setupWebGL() {
  gDone = false;
  var el = document.querySelector('.slide-background.present');
  var scene = gScene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

  var renderer = gRenderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth * 2, window.innerHeight * 2);
  renderer.setClearColor(0x333333);
  el.appendChild(renderer.domElement);

  var nucleus = makeNucleus(scene, new THREE.Vector3(0, 0, 0));
  nucleus.animate = true;

  camera.position.z = 600;

  // var dirLight = new THREE.DirectionalLight(0x222222, 1);
  // dirLight.position.set(100, 100, 50);
  // scene.add(dirLight);

  // var dirLight = new THREE.DirectionalLight(0x222222, 1);
  // dirLight.position.set(-100, -100, -50);
  // scene.add(dirLight);

  var ambLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambLight);

  render(renderer, scene, camera, nucleus);

  var label = document.createElement('h3');
  label.className = 'label';
  el.appendChild(label);
}

var steps = [
  step,
  copy,
  goBack,
  goBack,
  goBack,
  goBack,
  goBack,
  goForward,
  goForward,
  goForward,
  goTo.bind(null, 2),
  goTo.bind(null, 5),
  goTo.bind(null, 2),
  goTo.bind(null, 4),
  goTo.bind(null, 1),
  goTo.bind(null, 0),
  goTo.bind(null, 4)
];

function removeAllNodes(nodes) {
  for(var i=0; i<nodes.length; i++) {
    var node = nodes[i];
    node.parentNode.removeChild(node);
  }
}

Reveal.addEventListener('slidechanged', function() {
  if(document.querySelector('.app-state')) {
    setTimeout(setupWebGL, 0);

    var slide = document.querySelector('section.present');
    steps.forEach(function() {
      var fragment = document.createElement('div');
      fragment.className = 'fragment temporary';
      slide.appendChild(fragment);
    });
  }
  else {
    gDone = true;
    gScene = null;
    currentNucleus = 6;
    // Just remove them all
    removeAllNodes(document.querySelectorAll('.slide-background canvas'));
    removeAllNodes(document.querySelectorAll('.fragment.temporary'));
    removeAllNodes(document.querySelectorAll('h3.label'));
  }
});

Reveal.addEventListener('fragmentshown', function(e) {
  if(gAnimating) {
    Reveal.prevFragment();
  }
  else if(gScene) {
    var idx = parseInt(e.fragment.dataset.fragmentIndex);
    steps[idx](gScene);
  }
});

Reveal.addEventListener('fragmenthidden', function(e) {
});

function highlightStrings(nodes) {
  nodes.forEach(function(node) {
    if(node.textContent.indexOf('"highlight ') !== -1) {
      node.textContent = node.textContent.slice(
        '"highlight '.length, -1
      );
      node.style.color = '#e45ba1';
    }
    else if(node.textContent.indexOf('"appear') === 0) {
      node.textContent = node.textContent.slice(
        '"appear '.length, -1
      );
      node.style.color = '#e45ba1';
      node.classList.add('fragment');
    }
  });
}

function highlightParams(nodes) {
  nodes.forEach(function(node) {
    var content = node.textContent;
    content = content.replace(/"highlight[^"]*"/g, function(x) {
      return '<span style="color: #e45ba1">' +
        x.slice('"highlight '.length, -1) +
        '</span>';
    });
    node.innerHTML = content;
  });
}

Reveal.addEventListener('ready', function(e) {
  // Wait until the code has been highlighted (is there an event for
  // this?)
  setTimeout(function() {
    var nodes = document.querySelectorAll('.hljs-string');
    if(nodes.length) {
      highlightStrings(Array.prototype.slice.call(nodes));
    }

    nodes = document.querySelectorAll('.hljs-params');
    if(nodes.length) {
      highlightParams(Array.prototype.slice.call(nodes));
    }
  }, 100);
});
