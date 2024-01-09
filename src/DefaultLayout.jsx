import { Image, View } from 'react-native'
import Logo from '@assets/logo.png'

const DefaultLayout = ({ children }) => {
	return (
		<View className="bg-black h-screen w-full py-1">
			<Image className={'ml-4 mt-6 h-5 w-24 '} source={Logo}></Image>
			{children}
		</View>
	)
}

export default DefaultLayout
