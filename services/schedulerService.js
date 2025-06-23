const cron = require('node-cron');
const RankingService = require('./rankingService');
const rankingService = new RankingService();

class SchedulerService {
    constructor() {
        // Get all regions from the countries array in load-all.html
        this.regions = [
            // Hot locations
            'China', 'Hong Kong', 'Singapore', 'United States',
            // Asia
            'Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia',
            'Cyprus', 'Georgia', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel', 'Japan', 'Jordan',
            'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon', 'Macau', 'Malaysia', 'Maldives',
            'Mongolia', 'Myanmar', 'Nepal', 'North Korea', 'Oman', 'Pakistan', 'Palestine', 'Philippines',
            'Qatar', 'Saudi Arabia', 'South Korea', 'Sri Lanka', 'Syria', 'Taiwan', 'Tajikistan',
            'Thailand', 'Timor-Leste', 'Turkey', 'Turkmenistan', 'United Arab Emirates', 'Uzbekistan',
            'Vietnam', 'Yemen',
            // Europe
            'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria',
            'Croatia', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
            'Hungary', 'Iceland', 'Ireland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg',
            'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland',
            'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain',
            'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom', 'Vatican City',
            // Americas
            'Antigua and Barbuda', 'Argentina', 'Bahamas', 'Barbados', 'Belize', 'Bolivia', 'Brazil',
            'Canada', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Dominica', 'Dominican Republic',
            'Ecuador', 'El Salvador', 'Grenada', 'Guatemala', 'Guyana', 'Haiti', 'Honduras', 'Jamaica',
            'Mexico', 'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Saint Kitts and Nevis', 'Saint Lucia',
            'Saint Vincent and the Grenadines', 'Suriname', 'Trinidad and Tobago', 'Uruguay', 'Venezuela',
            // Africa
            'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cameroon',
            'Central African Republic', 'Chad', 'Comoros', 'Congo', "Côte d'Ivoire", 'Democratic Republic of the Congo',
            'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia',
            'Ghana', 'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi',
            'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda',
            'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa',
            'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe',
            // Oceania
            'Australia', 'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'New Zealand',
            'Palau', 'Papua New Guinea', 'Samoa', 'Solomon Islands', 'Tonga', 'Tuvalu', 'Vanuatu'
        ];
        this.serviceTypes = ['eor', 'payroll'];
    }

    // Start scheduled tasks
    startScheduledTasks() {
        // Schedule task to run at 12:00 PM (noon) on the 1st day of every month
        cron.schedule('0 12 1 * *', async () => {
            console.log('Starting monthly rankings update task...');
            await this.updateMonthlyRankings();
        });

        console.log('Monthly rankings auto-update task has been scheduled');
    }

    // Update rankings for all regions and service types
    async updateMonthlyRankings() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // JavaScript months are 0-based

        console.log(`Starting to update rankings for ${year}-${month}`);

        try {
            for (const region of this.regions) {
                for (const serviceType of this.serviceTypes) {
                    console.log(`Updating rankings for ${region} - ${serviceType}...`);
                    try {
                        // Generate new rankings without clearing existing data
                        await rankingService.generateRankings(region, serviceType, year, month);
                        console.log(`Successfully updated rankings for ${region} - ${serviceType}`);
                    } catch (error) {
                        console.error(`Failed to update rankings for ${region} - ${serviceType}:`, error);
                        // Continue with other regions and service types
                    }
                }
            }
            console.log('Monthly rankings update completed successfully');
        } catch (error) {
            console.error('Monthly rankings update task failed:', error);
        }
    }

    // Manual trigger for testing
    async triggerManualUpdate() {
        console.log('Manually triggering rankings update...');
        await this.updateMonthlyRankings();
    }
}

module.exports = SchedulerService; 