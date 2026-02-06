// API service for backend communication
import axios from 'axios';
import type { TaskData, FeedbackResponse, ClaimResponse, AdminReportRequest, AdminReportResponse, SpaceTrackingRequest, SpaceTrackingResponse, UserRewardsResponse } from './types';

const API_BASE_URL = 'http://localhost:5000/api/v1';

// API Functions

export const getUser = async (accessToken: any): Promise<TaskData | null> => {
  try {
    const response = await axios({
      method: 'get',
      url: `${API_BASE_URL}/users/me`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.log('Error fetching next task:', error);
    return null;
  }
};

export const fetchNextTask = async (userId: string): Promise<TaskData | null> => {
  try {
    const response = await axios({
      method: 'get',
      url: `${API_BASE_URL}/daily-tasks`,
      data: {
        userId
      },
    });

    return response.data;
  } catch (error) {
    console.log('Error fetching next task:', error);
    return null;
  }
};

export const submitFeedback = async (
  accessToken: string,
  taskId: string,
  sentiment: number,
  comment: string = ''
): Promise<FeedbackResponse | null> => {
  try {
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}/extension/feedback`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      data: {
        taskId,
        sentiment,
        comment
      },
    });

    return response.data;
  } catch (error) {
    console.log('Error submitting feedback:', error);
    return null;
  }
};

export const claimReward = async (accessToken: string, rewardId: string): Promise<ClaimResponse | null> => {
  try {
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}/extension/rewards/claim`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      data: {
        rewardId
      },
    });

    return response.data;
  } catch (error) {
    console.log('Error claiming reward:', error);
    return null;
  }
};

export const submitAdminReport = async (accessToken: string, reportData: AdminReportRequest): Promise<AdminReportResponse | null> => {
  try {
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}/extension/reports`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      data: reportData,
    });

    return response.data;
  } catch (error) {
    console.log('Error submitting admin report:', error);
    return null;
  }
};

export const fetchAvailableSpaces = async (accessToken: string): Promise<any[] | null> => {
  try {
    const response = await axios({
      method: 'get',
      url: `${API_BASE_URL}/spaces`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    const result = response.data;
    return result;
  } catch (error) {
    console.log('Error fetching available spaces:', error);
    return null;
  }
};

export const submitSpaceTracking = async (accessToken: string, spaceData: SpaceTrackingRequest): Promise<SpaceTrackingResponse | null> => {
  try {
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}/spaces/attendance`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      data: spaceData,
    });

    return response.data;
  } catch (error) {
    console.log('Error submitting space tracking:', error);
    return null;
  }
};

export const fetchUserScore = async (username: string): Promise<{ username: string; score: number; timestamp: string } | null> => {
  try {
    const response = await axios({
      method: 'get',
      url: `${API_BASE_URL}/extension/x_score/score/${encodeURIComponent(username)}`,
    });

    return response.data;
  } catch (error) {
    console.log('Error fetching user score:', error);
    return null;
  }
};

export const getUserRewards = async (accessToken: string): Promise<UserRewardsResponse | null> => {
  try {
    const response = await axios({
      method: 'get',
      url: `${API_BASE_URL}/users/rewards`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.log('Error fetching user score:', error);
    return null;
  }
};




