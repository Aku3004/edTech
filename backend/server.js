import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 3000;

// Connect to the database
connectDB()
.then(() => {
    if (process.env.NODE_ENV !== 'test') {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
}).catch((error) => {
    console.error('Failed to start server:', error);
});
