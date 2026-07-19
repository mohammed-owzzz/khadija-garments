import axios from 'axios'

export const sendOtpSms = async (toPhone, otp, type) => {
  const response = await axios.get('https://www.fast2sms.com/dev/twoway', {
    params: {
      authorization: process.env.FAST2SMS_API_KEY,
      variables_values: otp,
      route: 'otp',
      numbers: toPhone,
    },
    headers: {
      'cache-control': 'no-cache',
    },
  })

  // Fast2SMS returns { return: true } on success
  if (!response.data?.return) {
    throw new Error(response.data?.message || 'Fast2SMS OTP send failed')
  }

  return response.data
}