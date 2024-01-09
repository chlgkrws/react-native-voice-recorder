import {
	Button,
	Image,
	PermissionsAndroid,
	Platform,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import { useEffect, useState } from 'react'
import RNFS from 'react-native-fs'
import { RNS3 } from 'react-native-aws3'
import {
	AudioEncoderAndroidType,
	AudioSourceAndroidType,
	OutputFormatAndroidType,
} from 'react-native-audio-recorder-player/index'
import AudioRecorderPlayer from 'react-native-audio-recorder-player'
import DefaultLayout from 'src/DefaultLayout'
import MicIcon from '@assets/mic.png'
import PulseAnimation from '@components/PulseAnimation'
import formatDateWithText from '@utils/DateUtil'
import { S3_OPTION } from 'src/Settings'

const audioRecorderPlayer = new AudioRecorderPlayer()
const HomeScreen = () => {
	const [clicked, setClicked] = useState(false)
	const [filePath, setFilePath] = useState('')
	const [fileName, setFileName] = useState('')
	const [recordDuration, setRecordDuration] = useState({
		recordSecs: 0,
		recordTime: '00:00:00',
	})
	const [playerDuration, setPlayerDuration] = useState({
		currentPositionSec: 0,
		currentDurationSec: 0,
		playTime: '00:00:00',
		duration: '00:00:00',
	})
	const [isPlaying, setIsPlaying] = useState(false)

	useEffect(() => {
		setFileName(filePath.split('/')[filePath.split('/').length - 1])
	}, [filePath])

	const handleRecord = async () => {
		if (clicked) {
			setClicked(!clicked)
			// 녹음 중지
			if (audioRecorderPlayer) {
				await audioRecorderPlayer.stopRecorder()
			}
			audioRecorderPlayer.removeRecordBackListener()
			setRecordDuration({ ...recordDuration, recordSecs: 0 })
		} else {
			// 녹음 시작
			setClicked(!clicked)
			if (Platform.OS === 'android') {
				try {
					if (Platform.Version < 33) {
						const storageGrants = await PermissionsAndroid.requestMultiple([
							PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
							PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
						])
						console.log(storageGrants)
						if (
							storageGrants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
								PermissionsAndroid.RESULTS.GRANTED &&
							storageGrants['android.permission.READ_EXTERNAL_STORAGE'] ===
								PermissionsAndroid.RESULTS.GRANTED
						) {
							console.log('Permissions storage granted')
						} else {
							console.log('All required permissions not storage granted')
							return
						}
					}

					const recordGrant = await PermissionsAndroid.request(
						PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
					)
					if (recordGrant !== 'granted') {
						console.log('Permissions storage audio granted')
						return
					}
				} catch (err) {
					console.warn(err)
					return
				}
			}
			const path = Platform.select({
				android: RNFS.DocumentDirectoryPath + '/' + formatDateWithText('hello.mp4'),
				ios: formatDateWithText('hello.m4a'),
			})

			const audioSet = {
				AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
				AudioSourceAndroid: AudioSourceAndroidType.MIC,
				OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
				SampleRateAndroid: 44100,
				NumberOfChannelsAndroid: 2,
				BitRateAndroid: 128000,
			}

			if (audioRecorderPlayer) {
				setPlayerDuration({
					...playerDuration,
					currentPositionSec: 0,
					currentDurationSec: 0,
					playTime: '00:00:00',
					duration: '00:00:00',
				})
				const url = await audioRecorderPlayer.startRecorder(path, audioSet)
				setFilePath(url)
				audioRecorderPlayer.addRecordBackListener((e) => {
					setRecordDuration({
						...recordDuration,
						recordSecs: e.currentPosition,
						recordTime: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
					})
				})
				console.log(url)
			}
		}
	}
	const soundStart = async () => {
		setIsPlaying(!isPlaying)
		await audioRecorderPlayer.startPlayer(filePath)
		audioRecorderPlayer.addPlayBackListener((e) => {
			setPlayerDuration({
				currentPositionSec: e.currentPosition,
				currentDurationSec: e.duration,
				playTime: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
				duration: audioRecorderPlayer.mmssss(Math.floor(e.duration)),
			})
		})
	}

	const soundStop = async () => {
		setIsPlaying(!isPlaying)
		await audioRecorderPlayer.stopPlayer()
		audioRecorderPlayer.removePlayBackListener()
		setPlayerDuration({
			...playerDuration,
			currentPositionSec: 0,
			currentDurationSec: 0,
			playTime: '00:00:00',
			duration: '00:00:00',
		})
	}

	const upload = () => {
		function getFileMimeType() {
			if (Platform.OS === 'android') {
				return 'video/mp4'
			}
			if (Platform.OS === 'ios') {
				return 'audio/mp4'
			}
		}
		const file = {
			uri: filePath,
			name: fileName,
			type: getFileMimeType(),
		}

		const options = S3_OPTION

		RNS3.put(file, options).then((response) => {
			console.log(response)
			if (response.status !== 201) {
				// error
			}
		})
	}
	return (
		<DefaultLayout>
			<View className="flex h-1/3 justify-center items-center w-screen relative mt-24">
				{clicked && (
					<PulseAnimation
						isPulse={clicked}
						className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
					/>
				)}
				<TouchableOpacity
					onPress={handleRecord}
					className="absolute"
					style={{ alignSelf: 'center' }}
				>
					<Image source={MicIcon} className="w-24 h-24" />
				</TouchableOpacity>
				<Text className="absolute text-lg text-white bottom-4">
					녹음 시간: {recordDuration.recordTime}
				</Text>
				{!clicked && filePath && !isPlaying && (
					<Text className="absolute bottom-0 text-white">{fileName}</Text>
				)}
			</View>
			<View className="flex-1 items-center justify-center">
				<View className="flex-row justify-center items-center">
					{!clicked && filePath && isPlaying && (
						<Button className="w-1/3" title="재생 중지" onPress={soundStop} />
					)}
					{!clicked && filePath && !isPlaying && (
						<>
							<View>
								<Button className="w-1/3" title="재생 시작" onPress={soundStart} />
							</View>
							<View className="ml-5">
								<Button className="w-1/3" title="업로드" onPress={upload} />
							</View>
						</>
					)}
				</View>
			</View>
		</DefaultLayout>
	)
}

export default HomeScreen
