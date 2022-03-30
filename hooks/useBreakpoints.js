import { useMediaQuery } from "@mantine/hooks"
const BREAKPOINTS = {
	xs: 576,
	sm: 768,
	md: 992,
	lg: 1200,
	xl: 1400,
}

export const useBreakpoint = () => {

	const xs = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`)
	const sm = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`)
	const md = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`)
	const lg = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`)
	const xl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`)

	return {
		xs, sm, md, lg, xl
	}
}
