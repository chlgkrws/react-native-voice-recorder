import React, { useRef, useEffect, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

const PulseAnimation = ({ isPulse = false }) => {
	const animatedValue = useRef(new Animated.Value(1)).current
	const opacityValue = useRef(new Animated.Value(0.5)).current
	const [animationRunning, setAnimationRunning] = useState(isPulse)

	useEffect(() => {
		setAnimationRunning(isPulse)
	}, [isPulse])

	useEffect(() => {
		const animation = Animated.loop(
			Animated.sequence([
				Animated.parallel([
					Animated.timing(animatedValue, {
						toValue: 3,
						duration: 700,
						useNativeDriver: true,
					}),
					Animated.timing(opacityValue, {
						toValue: 0,
						duration: 700,
						useNativeDriver: true,
					}),
				]),
				Animated.parallel([
					Animated.timing(animatedValue, {
						toValue: 1,
						duration: 0,
						useNativeDriver: true,
					}),
					Animated.timing(opacityValue, {
						toValue: 0.5,
						duration: 0,
						useNativeDriver: true,
					}),
				]),
			]),
		)
		if (animationRunning) {
			animation.start()
		} else {
			animation.stop()
		}
		return () => animation.stop()
	}, [animationRunning, animatedValue, opacityValue])

	return (
		<View style={styles.container}>
			<Animated.View
				style={[
					styles.pulseCircle,
					{
						transform: [{ scale: animatedValue }],
						opacity: opacityValue,
					},
				]}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {},
	pulseCircle: {
		borderWidth: 1,
		borderColor: 'white',
		width: 100,
		height: 100,
		borderRadius: 80,
	},
})

export default PulseAnimation
