import { Button } from '@mui/material';
import edumeetConfig from '../../utils/edumeetConfig';
import { imprintLabel } from '../translated/translatedComponents';

/**
 * Small link button used on the join screen actions footer.
 * If no imprint URL is configured, render nothing.
 */
const ImpressumButton = (): JSX.Element | null => {
	const imprintUrl = edumeetConfig.imprintUrl ?? '';

	if (!imprintUrl.trim()) return null;

	return (
		<Button
			component='a'
			href={imprintUrl}
			target='_blank'
			rel='noreferrer'
			variant='text'
			size='small'
			color='inherit'
		>
			{imprintLabel()}
		</Button>
	);
};

export default ImpressumButton;
