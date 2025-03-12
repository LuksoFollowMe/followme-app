import { ref } from 'vue'
import { createClientUPProvider } from '@lukso/up-provider'
import { ethers } from 'ethers'
import { ERC725 } from '@erc725/erc725.js'
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json'
import LSP26FollowerSystem from '@/abi/LSP26FollowerSystem.json'
import FollowMe from '@/abi/FollowMe.json'
import UniversalProfile from '@/abi/UniversalProfile.json'

const followMeAddress = '0xa8Bab677C86b35a824426d771E0f6b92917cb9C9'
const LSP26FollowerSystemAddress = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA'
const permissions = '0x0000000000000000000000000000000000000000000000000000000000000500'

const contextAccount = ref(undefined)
const contextCampaign = ref(BigInt(0))
const contextBalance = ref(BigInt(0))

const account = ref(undefined)
const accountIsFollowingContext = ref(false)
const accountCanCollect = ref(false)

export function useProvider() {
  const upProvider = createClientUPProvider()

  const eip1193Provider = {
    request: async (args) => {
      if (args.method === 'eth_getTransactionByHash') {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
      const response = await upProvider.request(args)
      if (response && typeof response === 'object' && 'result' in response) {
        return response.result
      }
      return response
    },
  }

  const browserProvider = new ethers.BrowserProvider(eip1193Provider)

  const LSP26FollowerSystemContract = new ethers.Contract(
    LSP26FollowerSystemAddress,
    LSP26FollowerSystem,
    browserProvider,
  )
  const followMeContract = new ethers.Contract(followMeAddress, FollowMe, browserProvider)

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
      contextCampaign.value = BigInt(await getCampaign(_accounts[0]))
      contextBalance.value = BigInt(await browserProvider.getBalance(_accounts[0]))
      contextAccount.value = _accounts[0]
      setIsFollowingContext()
    } else {
      contextBalance.value = BigInt(0)
      contextCampaign.value = BigInt(0)
      contextAccount.value = undefined
    }
  }

  const startCampaign = async (amount, maxAmount) => {
    amount = ethers.parseUnits(amount, 'ether')
    maxAmount = ethers.parseUnits(maxAmount, 'ether')

    if (!(await hasNativePermission())) {
      await setNativePermissions()
    }

    const signer = await browserProvider.getSigner()

    return await followMeContract
      .connect(signer)
      .startCampaign([amount, maxAmount], {
        gasLimit: 600000,
      })
      .then(() => {
        contextCampaign.value = BigInt(amount)
        return
      })
      .catch(() => {
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
        contextCampaign.value = BigInt(0)
        return
      })
      .catch(() => {
        return
      })
  }

  const setIsFollowingContext = async () => {
    if (!contextAccount.value || !account.value || contextAccount.value === account.value) {
      accountIsFollowingContext.value = false
      accountCanCollect.value = false
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
    const upContract = new ethers.Contract(account.value, UniversalProfile, signer)

    const LSP26FollowerSystemCalldata =
      await LSP26FollowerSystemContract.follow.populateTransaction(contextAccount.value)

    const followMeContractCalldata = await followMeContract.collect.populateTransaction(
      contextAccount.value,
    )

    return await upContract
      .executeBatch(
        [0, 0],
        [LSP26FollowerSystemAddress, followMeAddress],
        [0, 0],
        [LSP26FollowerSystemCalldata.data, followMeContractCalldata.data],
        {
          gasLimit: 600000,
        },
      )
      .then(() => {
        accountIsFollowingContext.value = true
        accountCanCollect.value = false
        return
      })
  }

  const collect = async () => {
    const signer = await browserProvider.getSigner(account.value)

    return await followMeContract
      .connect(signer)
      .collect(contextAccount.value, {
        gasLimit: 600000,
      })
      .then(() => {
        accountIsFollowingContext.value = true
        accountCanCollect.value = false
        return
      })
  }

  const hasNativePermission = async () => {
    const erc725 = new ERC725(LSP6Schema, contextAccount.value, upProvider)

    const contextPermissions = await erc725.getData({
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: followMeAddress,
    })

    return (
      contextPermissions &&
      typeof contextPermissions.value === 'string' &&
      contextPermissions.value === permissions
    )
  }

  const getCampaign = async (address) => {
    return await followMeContract.getCampaign(address)
  }

  const setNativePermissions = async () => {
    const erc725 = new ERC725(LSP6Schema, contextAccount.value, upProvider)

    const addressPermissionsArrayValue = await erc725.getData('AddressPermissions[]')
    let numberOfControllers = 0

    if (Array.isArray(addressPermissionsArrayValue.value)) {
      numberOfControllers = addressPermissionsArrayValue.value.length
    }

    const permissionData = erc725.encodeData([
      {
        keyName: 'AddressPermissions:Permissions:<address>',
        dynamicKeyParts: followMeAddress,
        value: permissions,
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
    return await myUniversalProfile.setDataBatch(permissionData.keys, permissionData.values)
  }

  upProvider.on('accountsChanged', accountsChanged)
  upProvider.on('contextAccountsChanged', contextAccountsChanged)

  return {
    account,
    contextAccount,
    accountIsFollowingContext,
    accountCanCollect,

    contextCampaign,
    contextBalance,

    startCampaign,
    cancelCampaign,

    followContext,
    collect,
  }
}
