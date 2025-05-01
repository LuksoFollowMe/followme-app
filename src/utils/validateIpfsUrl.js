import { defaultIpfsGateway } from '@/constants'

export const validateIpfsUrl = (url) => {
  return url.startsWith('ipfs://') ? defaultIpfsGateway + url.replace('ipfs://', '') : url
}
