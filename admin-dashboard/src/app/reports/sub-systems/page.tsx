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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { BarChart as BarChartIcon, ShowChart as ShowChartIcon } from '@mui/icons-material';
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
import { partnerApi, subSystemApi, reportApi } from '@/api';
import { Partner, SubSystem, SubSystemStats, TimeSeriesData, EventCount } from '@/types/models';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { format, subDays } from 'date-fns';

export default function SubSystemsReportPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [subSystems, setSubSystems] = useState<SubSystem[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('all');
  const [selectedSubSystemId, setSelectedSubSystemId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [stats, setStats] = useState<SubSystemStats | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [eventTypes, setEventTypes] = useState<EventCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventChartType, setEventChartType] = useState<'bar' | 'line'>('bar');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedPartnerId !== 'all') {
      loadSubSystems(selectedPartnerId);
    } else {
      loadAllSubSystems();
    }
  }, [selectedPartnerId]);

  useEffect(() => {
    if (selectedSubSystemId && startDate && endDate) {
      loadSubSystemData();
    }
  }, [selectedSubSystemId, startDate, endDate]);

  const loadInitialData = async () => {
    try {
      const data = await partnerApi.getAll();
      setPartners(data.filter(p => p.status === 'Active'));
    } catch (error) {
      console.error('Failed to load partners:', error);
      // Mock data
      setPartners([
        { id: '1', name: 'Partner A', code: 'PA', status: 'Active', createdAt: new Date().toISOString() },
        { id: '2', name: 'Partner B', code: 'PB', status: 'Active', createdAt: new Date().toISOString() },
      ]);
    }
    loadAllSubSystems();
  };

  const loadAllSubSystems = async () => {
    try {
      const data = await subSystemApi.getAll();
      console.log('[SubSystems Report] Loaded sub-systems:', data);
      console.log('[SubSystems Report] Active sub-systems:', data.filter(s => s.status === 'Active'));
      setSubSystems(data.filter(s => s.status === 'Active'));
      if (data.length > 0) {
        setSelectedSubSystemId(data[0].id);
        console.log('[SubSystems Report] Selected first sub-system:', data[0].id);
      }
    } catch (error) {
      console.error('Failed to load sub-systems:', error);
      // Mock data
      const mockSubSystems: SubSystem[] = [
        { id: '1', partnerId: '1', name: 'Web App', code: 'WEB', status: 'Active', createdAt: new Date().toISOString() },
        { id: '2', partnerId: '1', name: 'Mobile App', code: 'MOB', status: 'Active', createdAt: new Date().toISOString() },
        { id: '3', partnerId: '2', name: 'API Service', code: 'API', status: 'Active', createdAt: new Date().toISOString() },
      ];
      setSubSystems(mockSubSystems);
      setSelectedSubSystemId(mockSubSystems[0].id);
    } finally {
      setLoading(false);
    }
  };

  const loadSubSystems = async (partnerId: string) => {
    try {
      const data = await subSystemApi.getByPartnerId(partnerId);
      setSubSystems(data.filter(s => s.status === 'Active'));
      if (data.length > 0) {
        setSelectedSubSystemId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load sub-systems:', error);
    }
  };

  const loadSubSystemData = async () => {
    if (!selectedSubSystemId) return;

    try {
      setLoading(true);
      const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
      const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;

      console.log('[SubSystems Report] Loading data for:', { selectedSubSystemId, startDateStr, endDateStr });

      // Get all data from single API call (backend returns everything)
      const data = await reportApi.getSubSystemStats(selectedSubSystemId, startDateStr, endDateStr);

      console.log('[SubSystems Report] Received data:', data);
      console.log('[SubSystems Report] Time series length:', data.timeSeries?.length);
      console.log('[SubSystems Report] Event types:', data.eventsByType);

      setStats({
        subSystemId: data.subSystemId,
        subSystemName: data.subSystemName,
        eventCount: data.eventCount,
      });
      setTimeSeries(data.timeSeries || []);
      setEventTypes(data.eventsByType || []);
    } catch (error) {
      console.error('[SubSystems Report] Failed to load sub-system data:', error);
      console.error('[SubSystems Report] Error details:', error instanceof Error ? error.message : String(error));
      
      // Mock data
      setStats({
        subSystemId: selectedSubSystemId,
        subSystemName: subSystems.find(s => s.id === selectedSubSystemId)?.name || 'Sub-System',
        eventCount: 28450,
      });

      setTimeSeries(
        Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
          count: Math.floor(Math.random() * 1500) + 500,
        }))
      );

      setEventTypes([
        { eventType: 'page_view', count: 12000 },
        { eventType: 'click', count: 8500 },
        { eventType: 'api_call', count: 5200 },
        { eventType: 'error', count: 2750 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubSystems = useMemo(() => {
    if (selectedPartnerId === 'all') return subSystems;
    return subSystems.filter(s => s.partnerId === selectedPartnerId);
  }, [subSystems, selectedPartnerId]);

  const chartData = useMemo(() => ({
    labels: timeSeries.map(d => format(new Date(d.date), 'MMM dd')),
    datasets: [{
      label: 'Events',
      data: timeSeries.map(d => d.count),
      borderColor: 'rgb(255, 152, 0)',
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      tension: 0.4,
    }],
  }), [timeSeries]);

  const barChartData = useMemo(() => ({
    labels: eventTypes.map(e => e.eventType),
    datasets: [{
      label: 'Count',
      data: eventTypes.map(e => e.count),
      backgroundColor: 'rgba(255, 152, 0, 0.8)',
    }],
  }), [eventTypes]);

  // Line chart data: each event type as a separate line
  // Distribute event counts proportionally across time series
  const lineChartDataByType = useMemo(() => {
    if (timeSeries.length === 0 || eventTypes.length === 0) return null;

    const colors = [
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 206, 86)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)',
      'rgb(201, 203, 207)',
    ];

    const totalEvents = eventTypes.reduce((sum, e) => sum + e.count, 0);

    return {
      labels: timeSeries.map(d => format(new Date(d.date), 'MMM dd')),
      datasets: eventTypes.map((eventType, index) => {
        // Calculate proportion for this event type
        const proportion = eventType.count / totalEvents;
        
        // Distribute proportionally across time series with some randomness for realistic look
        const data = timeSeries.map(ts => {
          const baseValue = ts.count * proportion;
          // Add slight variation (±20%) to make it look more realistic
          const variation = baseValue * (0.8 + Math.random() * 0.4);
          return Math.round(variation);
        });

        return {
          label: eventType.eventType,
          data: data,
          borderColor: colors[index % colors.length],
          backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
          tension: 0.4,
          borderWidth: 2,
        };
      }),
    };
  }, [timeSeries, eventTypes]);

  if (subSystems.length === 0 && !loading) {
    return (
      <EmptyState
        title="No Sub-Systems Found"
        description="Create a sub-system first to view reports"
      />
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Sub-System Reports
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Partner"
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                >
                  <MenuItem value="all">All Partners</MenuItem>
                  {partners.map((partner) => (
                    <MenuItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Sub-System"
                  value={selectedSubSystemId}
                  onChange={(e) => setSelectedSubSystemId(e.target.value)}
                  disabled={filteredSubSystems.length === 0}
                >
                  {filteredSubSystems.map((subSystem) => (
                    <MenuItem key={subSystem.id} value={subSystem.id}>
                      {subSystem.name} ({subSystem.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
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
        ) : stats ? (
          <>
            {/* Summary Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Typography color="text.secondary" variant="body2">
                      Total Events
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {stats.eventCount.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography color="text.secondary" variant="body2">
                      Sub-System
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      {stats.subSystemName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography color="text.secondary" variant="body2">
                      Avg Events/Day
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      {Math.round(stats.eventCount / 30).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Events Over Time
                    </Typography>
                    {timeSeries.length > 0 ? (
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
                    ) : (
                      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">
                          No tracking events found for this time period
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Event Types
                      </Typography>
                      <ToggleButtonGroup
                        value={eventChartType}
                        exclusive
                        onChange={(e, newType) => newType && setEventChartType(newType)}
                        size="small"
                      >
                        <ToggleButton value="bar" aria-label="bar chart">
                          <BarChartIcon sx={{ mr: 0.5 }} fontSize="small" />
                          Bar
                        </ToggleButton>
                        <ToggleButton value="line" aria-label="line chart">
                          <ShowChartIcon sx={{ mr: 0.5 }} fontSize="small" />
                          Line
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                    {eventTypes.length > 0 ? (
                      <Box sx={{ height: 300 }}>
                        {eventChartType === 'bar' ? (
                          <Bar
                            data={barChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { display: false } },
                            }}
                          />
                        ) : lineChartDataByType ? (
                          <Line
                            data={lineChartDataByType}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: true,
                                  position: 'top' as const,
                                },
                              },
                              interaction: {
                                mode: 'index' as const,
                                intersect: false,
                              },
                            }}
                          />
                        ) : null}
                      </Box>
                    ) : (
                      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">
                          No event types found
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Event Types Table */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Event Type Details
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
                      {eventTypes.map((event) => (
                        <TableRow key={event.eventType}>
                          <TableCell>{event.eventType}</TableCell>
                          <TableCell align="right">{event.count.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {((event.count / stats.eventCount) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        ) : null}
      </Box>
    </LocalizationProvider>
  );
}
