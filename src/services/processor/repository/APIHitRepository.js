import mongoose from 'mongoose';
import { BaseRepository } from "./BaseRepository.js";


export class ApiHitRepository extends BaseRepository {
    constructor({ model, logger: l } = {}) {
        super({ logger: l })
        if (!model) {
            throw new Error("ApiHitRepository required mongoose model");
        }
        this.model = model;
    }


    async save(eventData) {
        try {
            const doc = new this.model(eventData);
            await doc.save();
            return doc;
        } catch (error) {
            if (error && error.code === 11000) {
                this.logger.warn('Duplicate event ID, skipping save', { eventId: eventData.eventId });
                return null;
            }
            this.logger.error('Error saving API hit:', error);
            throw error;
        }
    }

    async find(filer = {}, options = {}) {
        try {
            const { limit = 100, skip = 0, sort = { timestamp: -1 } } = options;
            const hits = await this.model.find(filer).sort(sort).limit(limit).skip(skip).lean();

            return hits;
        } catch (error) {
            this.logger.error('Error finding API hits:', error);
            throw error;
        }
    };


    async count(filters = {}) {
        try {
            const count = await this.model.countDocuments(filters);
            return count;
        } catch (error) {
            this.logger.error('Error counting API hits:', error);
            throw error;
        }
    }

    async countUniqueUsers({ clientId, startTime, endTime } = {}) {
        try {
            const match = {};

            if (clientId) {
                match.clientId = mongoose.Types.ObjectId.isValid(clientId)
                    ? new mongoose.Types.ObjectId(clientId)
                    : clientId;
            }

            if (startTime || endTime) {
                match.timestamp = {};
                if (startTime) match.timestamp.$gte = new Date(startTime);
                if (endTime) match.timestamp.$lte = new Date(endTime);
            }

            const result = await this.model.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: {
                            $ifNull: ['$userId', '$ip']
                        }
                    }
                },
                {
                    $count: 'uniqueUsers'
                }
            ]);

            return result.length > 0 ? result[0].uniqueUsers : 0;
        } catch (error) {
            this.logger.error('Error counting unique users:', error);
            return 0;
        }
    }

    async getUniqueUsersCountByClient(clientIds = []) {
        try {
            const match = {};
            if (clientIds && clientIds.length > 0) {
                match.clientId = {
                    $in: clientIds.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id)
                };
            }

            const result = await this.model.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: {
                            clientId: '$clientId',
                            user: { $ifNull: ['$userId', '$ip'] }
                        }
                    }
                },
                {
                    $group: {
                        _id: '$_id.clientId',
                        uniqueUsers: { $sum: 1 }
                    }
                }
            ]);

            const map = {};
            result.forEach(r => {
                if (r._id) {
                    map[r._id.toString()] = r.uniqueUsers;
                }
            });
            return map;
        } catch (error) {
            this.logger.error('Error getting unique users count by client:', error);
            return {};
        }
    }

    async deleteOldHits(beforeDate) {
        try {
            const result = await this.model.deleteMany({ timestamp: { $lt: beforeDate } });
            this.logger.info('Deleted old API hits', { count: result.deletedCount });
            return result.deletedCount;
        } catch (error) {
            this.logger.error('Error deleting old API hits:', error);
            throw error;
        }
    }
}