'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  Hub as HubIcon,
  EventNote as EventIcon,
} from '@mui/icons-material';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { reportApi } from '@/api';
import { DashboardStats } from '@/types/models';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { format, subDays } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value.toLocaleString()}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load data for last 30 days
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      const data = await reportApi.getDashboardStats(startDate, endDate);
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
      
      // Mock data for development
      setStats({
        totalEvents: 125680,
        totalPartners: 15,
        totalSubSystems: 42,
        eventsToday: 3456,
        eventsThisWeek: 24580,
        eventsThisMonth: 98450,
        topPartners: [
          { partnerId: '1', partnerName: 'Partner A', totalEvents: 45000, activeSubSystems: 8 },
          { partnerId: '2', partnerName: 'Partner B', totalEvents: 32000, activeSubSystems: 5 },
          { partnerId: '3', partnerName: 'Partner C', totalEvents: 28000, activeSubSystems: 7 },
        ],
        topSubSystems: [
          { subSystemId: '1', subSystemName: 'Web App', eventCount: 35000 },
          { subSystemId: '2', subSystemName: 'Mobile App', eventCount: 28000 },
          { subSystemId: '3', subSystemName: 'API Service', eventCount: 22000 },
          { subSystemId: '4', subSystemName: 'Background Jobs', eventCount: 18000 },
          { subSystemId: '5', subSystemName: 'Admin Portal', eventCount: 12000 },
        ],
        eventTimeSeries: Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
          count: Math.floor(Math.random() * 5000) + 2000,
        })),
        eventTypeDistribution: [
          { eventType: 'page_view', count: 45000 },
          { eventType: 'click', count: 32000 },
          { eventType: 'purchase', count: 8500 },
          { eventType: 'signup', count: 5200 },
          { eventType: 'error', count: 2800 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography color="error">
          {error || 'Failed to load data'}
        </Typography>
      </Box>
    );
  }

  // Chart data
  const lineChartData = {
    labels: stats.eventTimeSeries.map((d) => format(new Date(d.date), 'MMM dd')),
    datasets: [
      {
        label: 'Events',
        data: stats.eventTimeSeries.map((d) => d.count),
        borderColor: 'rgb(25, 118, 210)',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const doughnutChartData = {
    labels: stats.eventTypeDistribution.map((d) => d.eventType),
    datasets: [
      {
        data: stats.eventTypeDistribution.map((d) => d.count),
        backgroundColor: [
          'rgba(25, 118, 210, 0.8)',
          'rgba(220, 0, 78, 0.8)',
          'rgba(255, 152, 0, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(156, 39, 176, 0.8)',
        ],
      },
    ],
  };

  return (
    <ErrorBoundary>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Dashboard
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Events"
              value={stats.totalEvents}
              icon={<EventIcon sx={{ color: 'white' }} />}
              color="rgba(25, 118, 210, 0.8)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Partners"
              value={stats.totalPartners}
              icon={<BusinessIcon sx={{ color: 'white' }} />}
              color="rgba(220, 0, 78, 0.8)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Sub-Systems"
              value={stats.totalSubSystems}
              icon={<HubIcon sx={{ color: 'white' }} />}
              color="rgba(255, 152, 0, 0.8)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Events Today"
              value={stats.eventsToday}
              icon={<TrendingUpIcon sx={{ color: 'white' }} />}
              color="rgba(76, 175, 80, 0.8)"
            />
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Events Over Time (Last 30 Days)
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line
                    data={lineChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Event Types
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Doughnut
                    data={doughnutChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Top Tables */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Partners
                </Typography>
                <Box>
                  {stats.topPartners.slice(0, 5).map((partner, index) => (
                    <Paper
                      key={partner.partnerId}
                      sx={{
                        p: 2,
                        mb: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" color="text.secondary">
                          #{index + 1}
                        </Typography>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {partner.partnerName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {partner.activeSubSystems} sub-systems
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        {partner.totalEvents.toLocaleString()}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Sub-Systems
                </Typography>
                <Box>
                  {stats.topSubSystems.slice(0, 5).map((subSystem, index) => (
                    <Paper
                      key={subSystem.subSystemId}
                      sx={{
                        p: 2,
                        mb: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" color="text.secondary">
                          #{index + 1}
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {subSystem.subSystemName}
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        {subSystem.eventCount.toLocaleString()}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </ErrorBoundary>
  );
}
