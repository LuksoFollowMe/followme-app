import { ref, computed } from 'vue'
import { createClientUPProvider } from '@lukso/up-provider'
import { ethers } from 'ethers'
import { ERC725 } from '@erc725/erc725.js'
import { followMeAddress, LSP26FollowerSystemAddress } from '@/constants'
import { validateIpfsUrl } from '@/utils/validateIpfsUrl.js'
import LPS1Schemas from '@erc725/erc725.js/schemas/LSP1UniversalReceiverDelegate.json'
import LSP3Schemas from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json'
import LSP4Schema from '@erc725/erc725.js/schemas/LSP4DigitalAsset'
import LSP5Schema from '@erc725/erc725.js/schemas/LSP5ReceivedAssets'
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json'
import LSP7DigitalAsset from '@/abi/LSP7DigitalAsset.json'
import LSP26FollowerSystem from '@/abi/LSP26FollowerSystem.json'
import FollowMe from '@/abi/FollowMe.json'
import UniversalProfile from '@/abi/UniversalProfile.json'

const contextAccount = ref(undefined)
const contextCampaign = ref([BigInt(0), 0x0])
const contextControllerErrors = ref([])
const contextAssets = ref([])
const contextProfileImage = ref(null)

const account = ref(undefined)
const accountIsFollowingContext = ref(false)
const accountCanCollect = ref(true)

const upProvider = createClientUPProvider()

const eip1193Provider = {
  request: async (args) => {
    const withTimeout = (promise, ms) =>
      Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))])

    const notRespondingMethods =
      args.method === 'eth_getTransactionByHash' || args.method === 'eth_getTransactionReceipt'

    const response = notRespondingMethods
      ? await withTimeout(upProvider.request(args), 2000)
      : await upProvider.request(args)

    return response && typeof response === 'object' && 'result' in response
      ? response.result
      : response
  },
}

const browserProvider = new ethers.BrowserProvider(eip1193Provider)

const followMeContract = new ethers.Contract(followMeAddress, FollowMe, browserProvider)

const getAssets = async (address) => {
  const returnAssets = []

  const nativeBalance = BigInt(await browserProvider.getBalance(address))
  if (nativeBalance > 0n) {
    returnAssets.push({
      assetAddress: '0x0000000000000000000000000000000000000000',
      name: 'Lukso',
      symbol: 'LYX',
      decimals: 18,
      balance: nativeBalance,
    })
  }

  const erc725 = new ERC725(LSP5Schema, address, upProvider)
  const assets = await erc725.getData('LSP5ReceivedAssets[]')

  if (assets.value.length > 0) {
    const assetPromises = assets.value.map(async (asset) => {
      try {
        const contract = new ethers.Contract(asset, LSP7DigitalAsset, browserProvider)
        const balance = contract.balanceOf(address)
        const decimals = contract.decimals()
        const erc725 = new ERC725(LSP4Schema, asset, upProvider)
        const metadata = erc725.getData(['LSP4TokenSymbol', 'LSP4TokenName'])

        const [resolvedBalance, resolvedDecimals, resolvedMetadata] = await Promise.all([
          balance,
          decimals,
          metadata,
        ])

        if (resolvedBalance > 0n) {
          return {
            assetAddress: asset,
            name: resolvedMetadata[1].value,
            symbol: resolvedMetadata[0].value,
            decimals: parseInt(resolvedDecimals),
            balance: resolvedBalance,
          }
        }
      } catch (err) {
        console.warn(`Error loading asset ${asset}:`, err)
      }

      return null
    })

    const resolvedAssets = await Promise.all(assetPromises)
    returnAssets.push(...resolvedAssets.filter(Boolean))
  }

  return returnAssets
}

const getContextProfileImage = async () => {
  const erc725 = new ERC725(LSP3Schemas, contextAccount.value, upProvider)
  const profileData = await erc725.fetchData('LSP3Profile')

  const images = profileData.value?.LSP3Profile?.profileImage

  if (!Array.isArray(images) || images.length === 0) {
    contextProfileImage.value = null
    return
  }

  const sortImages = images.filter((img) => img.url).sort((a, b) => (b.width ?? 0) - (a.width ?? 0))

  if (sortImages[0]?.url) {
    contextProfileImage.value = validateIpfsUrl(sortImages[0].url)
    return
  }

  contextProfileImage.value = null
}

const getCampaign = async (address) => {
  return await followMeContract.getCampaign(address)
}

const startCampaign = async (assetAddress, amount, maxAmount) => {
  const signer = await browserProvider.getSigner()
  contextCampaign.value = [BigInt(0), assetAddress]

  contextControllerErrors.value = await getControllerErrors(contextAccount.value)

  if (contextControllerErrors.value.includes('PERMISSIONS')) {
    try {
      await setControllerPermissions().then(async (trx) => {
        await trx.wait(1)
      })
    } catch (error) {
      return
    }
  }

  return await followMeContract
    .connect(signer)
    .startCampaign(
      [assetAddress, amount, maxAmount],
      contextControllerErrors.value.includes('URD'),
      {
        gasLimit: 600000,
      },
    )
    .then(async (trx) => {
      await trx.wait(1)
      contextControllerErrors.value = []
      contextCampaign.value = [BigInt(amount), assetAddress]
      return
    })
    .catch((e) => {
      console.warn(e)
      return
    })
}

const cancelCampaign = async () => {
  const signer = await browserProvider.getSigner()

  return await followMeContract
    .connect(signer)
    .cancelCampaign({
      gasLimit: 600000,
    })
    .then(() => {
      contextCampaign.value = [BigInt(0), 0x0]
      return
    })
    .catch(() => {
      return
    })
}

const setIsFollowingContext = async () => {
  if (!contextAccount.value || !account.value || contextAccount.value === account.value) {
    accountIsFollowingContext.value = false
    accountCanCollect.value = true
    return
  }

  const [exFollow, inFollow] = await followMeContract.isFollowing(
    contextAccount.value,
    account.value,
  )

  accountIsFollowingContext.value = exFollow
  accountCanCollect.value = !inFollow

  return
}

const followContext = async () => {
  const signer = await browserProvider.getSigner()

  const LSP26FollowerSystemContract = new ethers.Contract(
    LSP26FollowerSystemAddress,
    LSP26FollowerSystem,
    signer,
  )

  return await LSP26FollowerSystemContract.follow(contextAccount.value).then((trx) => {
    accountIsFollowingContext.value = true
    return trx
  })
}

const getRequiredPermissions = computed(() => {
  return {
    REENTRANCY: contextControllerErrors.value.includes('URD'),
    SUPER_SETDATA: contextControllerErrors.value.includes('URD'),
    ADDUNIVERSALRECEIVERDELEGATE: contextControllerErrors.value.includes('URD'),
    CHANGEUNIVERSALRECEIVERDELEGATE: contextControllerErrors.value.includes('URD'),
    SUPER_CALL: true,
    SUPER_TRANSFERVALUE: contextCampaign.value[1] == '0x0000000000000000000000000000000000000000',
  }
})

const getControllerErrors = async (address) => {
  const erc725 = new ERC725([...LPS1Schemas, ...LSP6Schema], address, upProvider)

  const erc725Data = await erc725.getData([
    {
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: followMeAddress,
    },
    {
      keyName: 'LSP1UniversalReceiverDelegate:<bytes32>',
      dynamicKeyParts: erc725.encodeKeyName('LSP26FollowerSystem_FollowNotification'),
    },
  ])

  const errors = []

  if (
    !erc725Data[0].value ||
    !ERC725.checkPermissions(
      Object.keys(getRequiredPermissions.value).filter((key) => getRequiredPermissions.value[key]),
      erc725Data[0].value,
    )
  ) {
    errors.push('PERMISSIONS')
  }

  if (erc725Data[1]?.value !== followMeAddress) {
    errors.push('URD')
  }
  return errors
}

const setControllerPermissions = async () => {
  const erc725 = new ERC725([...LPS1Schemas, ...LSP6Schema], contextAccount.value, upProvider)

  const addressPermissionsArrayValue = await erc725.getData('AddressPermissions[]')
  let numberOfControllers = 0

  if (Array.isArray(addressPermissionsArrayValue.value)) {
    numberOfControllers = addressPermissionsArrayValue.value.length
  }

  const erc725Data = erc725.encodeData([
    {
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: followMeAddress,
      value: erc725.encodePermissions(getRequiredPermissions.value),
    },
    {
      keyName: 'AddressPermissions[]',
      value: [followMeAddress],
      startingIndex: numberOfControllers,
      totalArrayLength: numberOfControllers + 1,
    },
  ])

  const signer = await browserProvider.getSigner()
  const myUniversalProfile = new ethers.Contract(contextAccount.value, UniversalProfile, signer)

  return await myUniversalProfile
    .setDataBatch(erc725Data.keys, erc725Data.values, {
      value: 0n,
      gasLimit: 1800000,
    })
    .then((trx) => {
      contextControllerErrors.value = contextControllerErrors.value.filter(
        (error) => error !== 'PERMISSIONS',
      )
      return trx
    })
}

const setContrtollerUrd = async () => {
  const signer = await browserProvider.getSigner()

  return await followMeContract
    .connect(signer)
    .registerReceiverDelegate()
    .then(async (trx) => {
      contextControllerErrors.value = contextControllerErrors.value.filter(
        (error) => error !== 'URD',
      )
      return trx
    })
    .catch((e) => {
      console.warn(e)
      return
    })
}

const campaignDetails = computed(() => {
  const assetAddress = contextCampaign.value[1]

  let asset = assetAddress
    ? contextAssets.value.find((a) => a.assetAddress.toLowerCase() === assetAddress.toLowerCase())
    : null

  if (!asset) {
    asset = {
      balance: 0n,
    }
  }

  return {
    ...asset,
    amount: contextCampaign.value[0],
    controllerErrors: contextControllerErrors.value,
  }
})

const accountsChanged = async (_accounts) => {
  if (_accounts[0] === account.value) {
    return
  }
  account.value = _accounts.length > 0 ? _accounts[0] : undefined
  setIsFollowingContext()
}

const contextAccountsChanged = async (_accounts) => {
  if (typeof _accounts[0] !== 'undefined') {
    if (_accounts[0] === contextAccount.value) {
      return
    }
    const campign = await getCampaign(_accounts[0])
    contextCampaign.value = [BigInt(campign[0]), campign[1]]
    contextAssets.value = await getAssets(_accounts[0])

    contextControllerErrors.value = await getControllerErrors(_accounts[0])
    contextAccount.value = _accounts[0]

    setIsFollowingContext()
    getContextProfileImage()
  } else {
    contextCampaign.value = BigInt(0)
    contextAccount.value = undefined
  }
}

upProvider.on('accountsChanged', accountsChanged)
upProvider.on('contextAccountsChanged', contextAccountsChanged)

export function useProvider() {
  return {
    account,
    accountIsFollowingContext,
    accountCanCollect,

    contextAccount,
    contextAssets,
    contextProfileImage,
    campaignDetails,

    startCampaign,
    cancelCampaign,
    setControllerPermissions,
    setContrtollerUrd,

    followContext,
  }
}
