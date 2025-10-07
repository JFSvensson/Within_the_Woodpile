import { CreatureType, type KeyBinding } from '../../types/game.js';

/**
 * Tangentbindningar för varelser
 */
export const KEY_BINDINGS: KeyBinding[] = [
  {
    creature: CreatureType.SPIDER,
    key: ' ',
    keyCode: 'Space',
    action: 'blowAway'
  },
  {
    creature: CreatureType.WASP,
    key: 'Escape',
    keyCode: 'Escape',
    action: 'duck'
  },
  {
    creature: CreatureType.HEDGEHOG,
    key: 's',
    keyCode: 'KeyS',
    action: 'backSlowly'
  },
  {
    creature: CreatureType.GHOST,
    key: 'l',
    keyCode: 'KeyL',
    action: 'lightLantern'
  },
  {
    creature: CreatureType.PUMPKIN,
    key: 'r',
    keyCode: 'KeyR',
    action: 'run'
  }
];