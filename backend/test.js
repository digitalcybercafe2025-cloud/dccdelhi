try {
    const routes = require('./routes/applicationRoutes');
    console.log('Routes loaded successfully');
} catch (e) {
    console.error('Error loading routes:', e);
}
