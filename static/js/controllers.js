const Controller = (function() {
  let pollingInterval = null;

  const gamepads = {};

  class Button {
    constructor(button) {
      this.value = button.value;
      this.pressed = button.pressed;
    }
  }

  class Gamepad {
    constructor(gamepad) {
      this.buttons = gamepad.buttons.map((button) => new Button(button));
    }

    analyzeButtons(newButtons) {
      if (this.buttons.length !== newButtons.length) {
        console.error('New buttons layout does not match saved one');
        return;
      }

      for (let i = 0; i < newButtons.length; ++i) {
        if (this.buttons[i].pressed !== newButtons[i].pressed) {
          window.dispatchEvent(
              new CustomEvent('gamepadbuttonpressed',
                  {
                    detail: {
                      key: i,
                      pressed: newButtons[i].pressed,
                    },
                  }));
        }
      }

      this.buttons = newButtons.map((button) => new Button(button));
    }
  }

  function gamepadConnected(gamepad) {
    gamepads[gamepad.index] = new Gamepad(gamepad);
  }

  function gamepadDisconnected(gamepad) {
    delete gamepad[gamepad.index];
  }

  function analyzeGamepad(gamepad) {
    const index = gamepad.index;
    const pGamepad = gamepads[index];

    if (pGamepad) {
      pGamepad.analyzeButtons(gamepad.buttons);
    }
  }

  function pollGamepads() {
    const gamepads =
        navigator.getGamepads ?
          navigator.getGamepads() :
          (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
    for (const gamepad of gamepads) {
      if (gamepad) {
        analyzeGamepad(gamepad);
      }
    }
  }

  function startWatching() {
    if (!pollingInterval) {
      window.addEventListener('gamepadconnected', function(e) {
        gamepadConnected(e.gamepad);
      });
      window.addEventListener('gamepaddisconnected', function(e) {
        gamepadDisconnected(e.gamepad);
      });
      pollingInterval = setInterval(pollGamepads, 5);
    }
  }

  function stopWatching() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  return {startWatching, stopWatching};
})();

function remoteControllerHandler(e) {
  const keyCode = e.keyCode;

  // Prevent the default behavior for specific keys
  switch (keyCode) {
      case tvKey.KEY_UP:
      case tvKey.KEY_DOWN:
      case tvKey.KEY_LEFT:
      case tvKey.KEY_RIGHT:
      case tvKey.KEY_ENTER:
      case tvKey.KEY_REMOTE_ENTER:
      case tvKey.KEY_RETURN:
      case tvKey.KEY_VOLUME_UP:
      case tvKey.KEY_VOLUME_DOWN:
      case tvKey.KEY_VOLUME_MUTE:
          e.preventDefault();
          break;
      default:
          // For other keys, do not prevent the default behavior
  }

  switch (keyCode) {
      case tvKey.KEY_UP:
          Navigation.up();
          break;
      case tvKey.KEY_DOWN:
          Navigation.down();
          break;
      case tvKey.KEY_LEFT:
          Navigation.left();
          break;
      case tvKey.KEY_RIGHT:
          Navigation.right();
          break;
      case tvKey.KEY_ENTER:
      case tvKey.KEY_REMOTE_ENTER:
          Navigation.accept();
          break;
      case tvKey.KEY_RETURN:
          Navigation.back();
          break;
      case tvKey.KEY_VOLUME_UP:
          tizen.tvaudiocontrol.setVolumeUp();
          break;
      case tvKey.KEY_VOLUME_DOWN:
          tizen.tvaudiocontrol.setVolumeDown();
          break;
      case tvKey.KEY_VOLUME_MUTE:
          tizen.tvaudiocontrol.setMute();
          break;
      case tvKey.KEY_RED:
          sendMessage('stopRequest');
          break;
      case tvKey.KEY_GREEN:
          Navigation.startBtn();
          break;
  }
}
