import { useParams } from 'react-router-dom';
import Home from './Home';

const LocationPage = () => {
    const { encodedName } = useParams();
    const locationName = decodeURIComponent(encodedName || '');
    return <Home initialQuery={locationName} />;
};

export default LocationPage;
