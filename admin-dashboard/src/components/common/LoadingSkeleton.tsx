'use client';

import { Box, Skeleton, Card, CardContent, Grid } from '@mui/material';

export function DashboardSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" height={40} />
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Skeleton variant="rectangular" height={300} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Skeleton variant="rectangular" height={300} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1 }} />
      ))}
    </Box>
  );
}

export function ChartSkeleton() {
  return <Skeleton variant="rectangular" height={300} />;
}
