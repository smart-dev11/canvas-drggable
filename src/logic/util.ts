export function randomAlpha(length: number) {
  return randomString(length, ALPHA_CHARS)
}

export const getRandomAvatar = async () => {
  const { default: avatar } = await import(`../assets/avatars/avatar_${Math.floor(Math.random() * 24) + 1}.jpg`)
  return avatar
}

export const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)

export const roundToDecimal = (val: number, toDecimal: number) => {
  const roundingMod = Math.pow(10, toDecimal)
  return Math.round(val * roundingMod) / roundingMod
}

export function randomString(length: number, availableChars: string[]) {
  let result = ''
  for (var i = length; i > 0; i--) result += availableChars[Math.floor(Math.random() * availableChars.length)]
  return result
}

export const ALPHA_CHARS = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
]

export const secondsToTimeCode = (secs: number) => {
  const hours = Math.floor(secs / 3600)
  const minutes = Math.floor((secs - hours * 3600) / 60)
  const seconds = Math.floor(secs - hours * 3600 - minutes * 60)
  const secondsStr = seconds < 10 ? '0' + seconds : '' + seconds
  const minutesStr = minutes < 10 ? '0' + minutes : '' + minutes
  if (hours > 0) {
    return hours + ':' + minutesStr + ':' + secondsStr
  }
  return minutesStr + ':' + secondsStr
}

export const arrayToObjectByProperty = (array: { [key: string]: any }[], key: string): {[key: string]: any} => array.reduce(
	(acc, cur) => ({ ...acc, [cur[key]]: cur }), {},
)

