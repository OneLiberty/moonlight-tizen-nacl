#include "moonlight.hpp"
#include "ppapi/c/ppb_gamepad.h"
#include <Limelight.h>
#include <sstream>

#define AXIS_DEAD_ZONE 0.1f

static const unsigned short k_StandardGamepadButtonMapping[] = {
    A_FLAG, B_FLAG, X_FLAG, Y_FLAG,
    LB_FLAG, RB_FLAG,
    0, 0,
    BACK_FLAG, PLAY_FLAG,
    LS_CLK_FLAG, RS_CLK_FLAG,
    UP_FLAG, DOWN_FLAG, LEFT_FLAG, RIGHT_FLAG,
    SPECIAL_FLAG
};

static const unsigned short k_BTGamepadButtonMapping[] = {
    A_FLAG,       // btn0
    B_FLAG,       // btn1
    0,            // btn2 unused
    X_FLAG,       // btn3
    Y_FLAG,       // btn4
    0,            // btn5 unused
    0,            // btn6 right stick X (handled as axis)
    0,            // btn7 right stick Y (handled as axis)
    BACK_FLAG,    // btn8
    PLAY_FLAG,    // btn9
    LS_CLK_FLAG,  // btn10
    RS_CLK_FLAG,  // btn11
    UP_FLAG,      // btn12
    DOWN_FLAG,    // btn13
    LEFT_FLAG,    // btn14
    RIGHT_FLAG,   // btn15
    SPECIAL_FLAG  // btn16
};

static bool s_padSeen[4] = {false, false, false, false};
static bool s_isTizenBT[4] = {false, false, false, false};

static float ApplyDeadZone(float value) {
    if (value > -AXIS_DEAD_ZONE && value < AXIS_DEAD_ZONE) {
        return 0.0f;
    }
    return value;
}

static short GetActiveGamepadMask(PP_GamepadsSampleData& gamepadData) {
    short controllerIndex = 0;
    short activeGamepadMask = 0;

    for (unsigned int p = 0; p < gamepadData.length; p++) {
        PP_GamepadSampleData& padData = gamepadData.items[p];
        if (!padData.connected) {
            continue;
        }
        activeGamepadMask |= (1 << controllerIndex);
        controllerIndex++;
    }

    return activeGamepadMask;
}

void MoonlightInstance::PollGamepads() {
    PP_GamepadsSampleData gamepadData;
    short controllerIndex = 0;
    short activeGamepadMask;

    m_GamepadApi->Sample(pp_instance(), &gamepadData);
    activeGamepadMask = GetActiveGamepadMask(gamepadData);

    for (unsigned int p = 0; p < gamepadData.length; p++) {
        PP_GamepadSampleData& padData = gamepadData.items[p];

        if (!padData.connected) {
            s_padSeen[p] = false;
            s_isTizenBT[p] = false;
            controllerIndex++;
            continue;
        }

        // Latch BT detection once on first sight of this pad,
        // but wait until both axes have settled to non-zero values
        if (!s_padSeen[p]) {
            if (padData.axes_length >= 2) {
                float ax0 = padData.axes[0];
                float ax1 = padData.axes[1];
                if (ax0 != 0.0f && ax1 != 0.0f) {
                    s_padSeen[p] = true;
                    s_isTizenBT[p] = (ax0 > 0.5f && ax0 < 1.5f &&
                                      ax1 > 0.5f && ax1 < 1.5f);
                }
            }
        }

        if (padData.timestamp != 0 && padData.timestamp == m_LastPadTimestamps[p]) {
            controllerIndex++;
            continue;
        }

        m_LastPadTimestamps[p] = padData.timestamp;

        bool isTizenBT = s_isTizenBT[p];

        int buttonFlags = 0;
        unsigned char leftTrigger = 0, rightTrigger = 0;
        short leftStickX = 0, leftStickY = 0;
        short rightStickX = 0, rightStickY = 0;

        const unsigned short* mapping = isTizenBT ?
            k_BTGamepadButtonMapping : k_StandardGamepadButtonMapping;
        size_t mappingSize = isTizenBT ?
            sizeof(k_BTGamepadButtonMapping) / sizeof(k_BTGamepadButtonMapping[0]) :
            sizeof(k_StandardGamepadButtonMapping) / sizeof(k_StandardGamepadButtonMapping[0]);

        if (isTizenBT) {
            // Buttons
            for (unsigned int i = 0; i < padData.buttons_length && i < mappingSize; i++) {
                if (mapping[i] && padData.buttons[i] > 0.5f) {
                    buttonFlags |= mapping[i];
                }
            }

            // Left stick: axes offset by 1.0 (range 0-2, center ~1.0)
            if (padData.axes_length >= 2) {
                float lx = padData.axes[0] - 1.0f;
                float ly = padData.axes[1] - 1.0f;
                leftStickX = (short)(ApplyDeadZone(lx) * 0x7FFF);
                leftStickY = (short)(-ApplyDeadZone(ly) * 0x7FFF);
            }

            // Right stick: packed into btn6 (X) and btn7 (Y)
            // range 0-1, center ~0.5, remap to -1 to 1
            if (padData.buttons_length > 7) {
                float rx = (padData.buttons[6] - 0.5f) * 2.0f;
                float ry = (padData.buttons[7] - 0.5f) * 2.0f;
                rightStickX = (short)(ApplyDeadZone(rx) * 0x7FFF);
                rightStickY = (short)(-ApplyDeadZone(ry) * 0x7FFF);
            }

            // LB, RB, LT, RT not reported on Tizen 4.0 BT - left as zero

        } else {
            // Standard USB layout
            for (unsigned int i = 0; i < padData.buttons_length && i < mappingSize; i++) {
                if (i == 6) {
                    leftTrigger = (unsigned char)(padData.buttons[i] * 0xFF);
                    continue;
                }
                if (i == 7) {
                    rightTrigger = (unsigned char)(padData.buttons[i] * 0xFF);
                    continue;
                }
                if (mapping[i] && padData.buttons[i] > 0.5f) {
                    buttonFlags |= mapping[i];
                }
            }

            if (padData.axes_length >= 2) {
                leftStickX = (short)(ApplyDeadZone(padData.axes[0]) * 0x7FFF);
                leftStickY = (short)(-ApplyDeadZone(padData.axes[1]) * 0x7FFF);
            }
            if (padData.axes_length >= 4) {
                rightStickX = (short)(ApplyDeadZone(padData.axes[2]) * 0x7FFF);
                rightStickY = (short)(-ApplyDeadZone(padData.axes[3]) * 0x7FFF);
            }
        }

        LiSendMultiControllerEvent(controllerIndex, activeGamepadMask,
            buttonFlags, leftTrigger, rightTrigger,
            leftStickX, leftStickY, rightStickX, rightStickY);

        controllerIndex++;
    }
}

void MoonlightInstance::ClControllerRumble(unsigned short controllerNumber,
    unsigned short lowFreqMotor, unsigned short highFreqMotor)
{
    const float weakMagnitude = static_cast<float>(highFreqMotor) / static_cast<float>(UINT16_MAX);
    const float strongMagnitude = static_cast<float>(lowFreqMotor) / static_cast<float>(UINT16_MAX);

    std::ostringstream ss;
    ss << controllerNumber << "," << weakMagnitude << "," << strongMagnitude;

    pp::Var response(std::string("controllerRumble: ") + ss.str());
    g_Instance->PostMessage(response);
}
