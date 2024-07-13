const hoveredClassName = 'hovered';
let gameCard;

function mark(value) {
  let element = typeof value === 'string' ? document.getElementById(value) : value;
  if (element) {
    element.classList.add(hoveredClassName);
    element.dispatchEvent(new Event('mouseenter'));
    if (!element.classList.contains('mdl-menu__item')) { //#FIXME: needed to properly show the restart dialog. Doesn't allow focus() for mdl-menu__item. 
      element.focus();
    }
  }
}

function unmark(value) {
  let element = typeof value === 'string' ? document.getElementById(value) : value;
  if (element) {
    element.classList.remove(hoveredClassName);
    element.dispatchEvent(new Event('mouseleave'));
    if (!element.classList.contains('mdl-menu__item')) { //#FIXME
      element.blur();
    }
  }
}

function isPopupActive(id) {
  return document
    .getElementById(id)
    .parentNode
    .children[1]
    .classList
    .contains('is-visible');
}

class ListView {
  constructor(func) {
    this.index = 0;
    this.func = func;
  }

  prev() {
    const array = this.func();
    unmark(array[this.index]);
    this.index = (this.index - 1 + array.length) % array.length;
    mark(array[this.index]);
    return array[this.index];
  }

  next() {
    const array = this.func();
    unmark(array[this.index]);
    this.index = (this.index + 1) % array.length;
    mark(array[this.index]);
    return array[this.index];
  }

  current() {
    return this.func()[this.index];
  }
}

function navigateGameCards(offset) { //helper function for Apps view
  let gameCards = Array.from(document.getElementById('game-grid').children);
  let currentIndex = gameCards.indexOf(gameCard);
  let newIndex = currentIndex + offset;

  if (newIndex >= 0 && newIndex < gameCards.length) {
    gameCard = gameCards[newIndex];
    gameCard.focus();
  }
}

const Views = {
  Hosts: {
    view: new ListView(() => document.getElementById('host-grid').children),
    up: function () { Navigation.change(Views.HostsNav) },
    down: function () { if ($('#gamepad-grid').children().length > 0) { Navigation.change(Views.Gamepads); } },
    left: function () { this.view.prev() },
    right: function () { this.view.next() },
    accept: function () {
      const element = this.view.current();
      if (element.id === 'addHostCell') {
        element.click();
      } else {
        element.children[0].click();
      }
    },
    startBtn: function () {
      const element = this.view.current();
      if (element.id != 'addHostCell') {
        element.children[1].click();
      }
    },
    enter: function () { mark(this.view.current()) },
    leave: function () { unmark(this.view.current()) },
  },
  HostsNav: {
    view: new ListView(function () {
      return [
        'selectResolution',
        'selectFramerate',
        'bitrateField',
        'externalAudioBtn',
        'mouseLockBtn',
        'optimizeGamesBtn',
      ];
    }),
    left: function () { this.view.prev() },
    right: function () { this.view.next() },
    down: function () { Navigation.change(Views.Hosts) },
    accept: function () { document.getElementById(this.view.current()).click() },
    enter: function () { mark(this.view.current()) },
    leave: function () { unmark(this.view.current()) },
  },
  AddHostDialog: {
    view: new ListView(function () {
        return [
          'dialogInputHost', 
          'continueAddHost', 
          'cancelAddHost'
        ];
    }),
    left: function () { if (this.view.current() !== 'dialogInputHost') {this.view.prev() } },
    right: function () { if (this.view.current() !== 'dialogInputHost') {this.view.next() } },
    up: function () { this.view.prev() },
    down: function () { this.view.next()},
    accept: function () { document.getElementById(this.view.current()).click() },
    back: function () { document.getElementById('cancelAddHost').click() },
    enter: function () { mark(this.view.current()) },
    leave: function () { unmark(this.view.current()) },
  },
  DeleteHostDialog: {
    view: new ListView(function () {
      return ['continueDeleteHost', 'cancelDeleteHost']
    }),
    left: function () { this.view.prev() },
    right: function () { this.view.next() },
    down: function () { document.getElementById('continueDeleteHost').click() },
    accept: function () { document.getElementById(this.view.current()).click() },
    back: function () { document.getElementById('cancelDeleteHost').click() },
    enter: function () { mark(this.view.current()) },
    leave: function () { unmark(this.view.current()) },
  },
  SelectResolutionMenu: {
    isActive: function () { return isPopupActive('resolutionMenu') },
    view: new ListView(function () {
      return document
        .getElementById('resolutionMenu')
        .parentNode
        .children[1]
        .children[1]
        .children
    }),
    up: function () { this.view.prev() },
    down: function () { this.view.next() },
    accept: function () { this.view.current().click() },
    back: function () { document.getElementById('selectResolution').click() },
    enter: function () { mark(this.view.current()) },
    leave: function () { unmark(this.view.current()) },
  },
  SelectFramerateMenu: {
    isActive: function () { return isPopupActive('framerateMenu') },
    view: new ListView(function () {
      return document
        .getElementById('framerateMenu')
        .parentNode
        .children[1]
        .children[1]
        .children
    }),
    up: function () { this.view.prev() },
    down: function () { this.view.next() },
    accept: function () { this.view.current().click() },
    back: function () { document.getElementById('selectFramerate').click() },
    enter: function () { mark(this.view.current()) },
    leave: function () { unmark(this.view.current()) },
  },
  SelectBitrateMenu: {
    isActive: function () { return isPopupActive('bandwidthMenu') },
    left: function () {
      bitrateSlider.stepDown();
      bitrateSlider.dispatchEvent(new Event('input'));
    },
    right: function () {
      bitrateSlider.stepUp();
      bitrateSlider.dispatchEvent(new Event('input'));
    },
    accept: function () { document.getElementById('bandwidthMenu').click() },
    back: function () { document.getElementById('bandwidthMenu').click() },
    enter: function () { },
    leave: function () { },
  },
  PairingDialog: {
    view: new ListView(function () { return ['cancelPairingDialog'] }),
    accept: function () { document.getElementById(this.view.current()).click() },
    back: function () { document.getElementById('cancelPairingDialog').click() },
    enter: function () { mark(this.view.current()) },
    leave: function () { unmark(this.view.current()) },
  },
  AppsNav: {
    view: new ListView(function () {
      return ['backIcon', 'quitCurrentApp']
    }),
    down: function () { Navigation.change(Views.Apps) },
    left: function () { this.view.prev() },
    right: function () { this.view.next() },
    accept: function () { document.getElementById(this.view.current()).click() },
    back: function () { document.getElementById('backIcon').click() },
    enter: function () { document.getElementById(this.view.current()).focus() },
    leave: function () { document.getElementById(this.view.current()).blur() },
  },
  Apps: {
    view: new ListView(function () { return document.getElementById('game-grid').children }),
    up: function () {
      let gameCards = Array.from(document.getElementById('game-grid').children);
      let currentIndex = gameCards.indexOf(gameCard);
      let cardsPerRow = Math.min(6, gameCards.length);

      if (currentIndex >= cardsPerRow) {
        navigateGameCards(-cardsPerRow);
      } else {
        Navigation.change(Views.AppsNav);
      }
    },
    down: function () {
      let gameCards = Array.from(document.getElementById('game-grid').children);
      let currentIndex = gameCards.indexOf(gameCard);
      let cardsPerRow = Math.min(6, gameCards.length);

      if (currentIndex + cardsPerRow < gameCards.length) {
        navigateGameCards(cardsPerRow);
      }
    },
    left: function () { navigateGameCards(-1) },
    right: function () { navigateGameCards(1) },
    accept: function () { gameCard.click() },
    back: function () { document.getElementById('backIcon').click() },
    enter: function () { if (gameCard) { gameCard.focus() } },
    leave: function () { unmark(this.view.current()) },
  },
  CloseAppDialog: {
    isActive: function () { return isDialogActive('quitAppDialog') },
    view: new ListView(function () {
      return ['continueQuitApp', 'cancelQuitApp']
    }),
    down: function () { Navigation.change(Views.Apps) },
    left: function () { this.view.prev() },
    right: function () { this.view.next() },
    accept: function () { document.getElementById(this.view.current()).click() },
    back: function () { document.getElementById('cancelQuitApp').click() },
    enter: function () { mark(this.view.current()) },
    leave: function () { unmark(this.view.current()) },
  },
};

const Navigation = (function () {
  let hasFocus = false;

  const Stack = (function () {
    const viewStack = [];

    function push(view) {
      if (get()) {
        get().leave();
      }
      viewStack.push(view);
      get().enter();
    }

    function change(view) {
      if (viewStack.length > 0) {
        get().leave();
        viewStack[viewStack.length - 1] = view;
        get().enter();
      } else {
        push(view);
      }
    }

    function pop() {
      if (viewStack.length > 1) {
        get().leave();
        viewStack.pop();
        get().enter();
      }
    }

    function get() {
      return viewStack[viewStack.length - 1];
    }

    return {get, push, change, pop};
  })();

  const State = (function() {
    let running = false;

    function start() {
      if (!running) {
        running = true;
        window.addEventListener('mousemove', loseFocus);
      }
    }

    function stop() {
      if (running) {
        running = false;
        window.removeEventListener('mousemove', loseFocus);
      }
    }

    function isRunning() {
      return running;
    }

    return {start, stop, isRunning};
  })();

  function loseFocus() {
    if (hasFocus) {
      hasFocus = false;
      if (Stack.get()) {
        Stack.get().leave();
      }
    }
  }

  function focus() {
    if (!hasFocus) {
      hasFocus = true;
      if (Stack.get()) {
        Stack.get().enter();
      }
    }
  }

  function runOp(name) {
    return () => {
      if (!State.isRunning()) {
        return;
      }

      if (!hasFocus) {
        focus();
        return;
      }

      const view = Stack.get();
      if (view && typeof view[name] === 'function') {
        view[name]();
      }
    };
  }

  return {
    accept: runOp('accept'),
    back: runOp('back'),
    left: runOp('left'),
    right: runOp('right'),
    up: runOp('up'),
    down: runOp('down'),
    startBtn: runOp('startBtn'),
    push: Stack.push,
    change: Stack.change,
    pop: Stack.pop,
    start: State.start,
    stop: State.stop,
  };
})();
