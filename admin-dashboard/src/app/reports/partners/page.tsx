'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { partnerApi, reportApi } from '@/api';
import { Partner, PartnerStats, TimeSeriesData } from '@/types/models';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { format, subDays } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function PartnersReportPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [partnerStats, setPartnerStats] = useState<PartnerStats | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    if (selectedPartnerId && startDate && endDate) {
      loadPartnerData();
    }
  }, [selectedPartnerId, startDate, endDate]);

  const loadPartners = async () => {
    try {
      const data = await partnerApi.getAll();
      setPartners(data.filter(p => p.status === 'Active'));
      if (data.length > 0) {
        setSelectedPartnerId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load partners:', error);
      // Mock data
      const mockPartners: Partner[] = [
        { id: '1', name: 'Partner A', code: 'PA', status: 'Active', createdAt: new Date().toISOString() },
        { id: '2', name: 'Partner B', code: 'PB', status: 'Active', createdAt: new Date().toISOString() },
        { id: '3', name: 'Partner C', code: 'PC', status: 'Active', createdAt: new Date().toISOString() },
      ];
      setPartners(mockPartners);
      setSelectedPartnerId(mockPartners[0].id);
    } finally {
      setLoading(false);
    }
  };

  const loadPartnerData = async () => {
    if (!selectedPartnerId) return;

    try {
      setLoading(true);
      const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
      const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;

      console.log('[Partners Report] Loading data for:', { selectedPartnerId, startDateStr, endDateStr });

      const [stats, timeData] = await Promise.all([
        reportApi.getPartnerStats(selectedPartnerId, startDateStr, endDateStr),
        reportApi.getTimeSeries(selectedPartnerId, undefined, startDateStr, endDateStr, 'day'),
      ]);

      console.log('[Partners Report] Received stats:', stats);
      console.log('[Partners Report] Received time series length:', timeData?.length);

      setPartnerStats(stats);
      setTimeSeries(timeData);
    } catch (error) {
      console.error('[Partners Report] Failed to load partner data:', error);
      console.error('[Partners Report] Error details:', error instanceof Error ? error.message : String(error));
      
      // Mock data
      setPartnerStats({
        partnerId: selectedPartnerId,
        partnerName: partners.find(p => p.id === selectedPartnerId)?.name || 'Partner',
        totalEvents: 45680,
        activeSubSystems: 8,
        topEventTypes: [
          { eventType: 'page_view', count: 18500 },
          { eventType: 'click', count: 12300 },
          { eventType: 'purchase', count: 3200 },
        ],
      });

      setTimeSeries(
        Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
          count: Math.floor(Math.random() * 2000) + 1000,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => ({
    labels: timeSeries.map(d => format(new Date(d.date), 'MMM dd')),
    datasets: [{
      label: 'Events',
      data: timeSeries.map(d => d.count),
      borderColor: 'rgb(25, 118, 210)',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      tension: 0.4,
    }],
  }), [timeSeries]);

  const eventTypeChartData = useMemo(() => {
    if (!partnerStats?.topEventTypes) return null;
    return {
      labels: partnerStats.topEventTypes.map(e => e.eventType),
      datasets: [{
        label: 'Count',
        data: partnerStats.topEventTypes.map(e => e.count),
        backgroundColor: 'rgba(25, 118, 210, 0.8)',
      }],
    };
  }, [partnerStats]);

  if (partners.length === 0 && !loading) {
    return (
      <EmptyState
        title="No Partners Found"
        description="Create a partner first to view reports"
      />
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Partner Reports
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Partner"
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                >
                  {partners.map((partner) => (
                    <MenuItem key={partner.id} value={partner.id}>
                      {partner.name} ({partner.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading ? (
          <TableSkeleton />
        ) : partnerStats ? (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      Total Events
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {partnerStats.totalEvents.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      Active Sub-Systems
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {partnerStats.activeSubSystems}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      Avg Events/Day
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {Math.round(partnerStats.totalEvents / 30).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      Status
                    </Typography>
                    <Chip label="Active" color="success" sx={{ mt: 1 }} />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Events Over Time
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Line
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                {eventTypeChartData && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Top Event Types
                      </Typography>
                      <Box sx={{ height: 300 }}>
                        <Bar
                          data={eventTypeChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>

            {/* Event Types Table */}
            {partnerStats.topEventTypes && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Event Type Breakdown
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Event Type</TableCell>
                          <TableCell align="right">Count</TableCell>
                          <TableCell align="right">Percentage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {partnerStats.topEventTypes.map((event) => (
                          <TableRow key={event.eventType}>
                            <TableCell>{event.eventType}</TableCell>
                            <TableCell align="right">{event.count.toLocaleString()}</TableCell>
                            <TableCell align="right">
                              {((event.count / partnerStats.totalEvents) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </Box>
    </LocalizationProvider>
  );
}
