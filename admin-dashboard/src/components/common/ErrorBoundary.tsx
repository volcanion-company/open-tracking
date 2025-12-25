'use client';

import { Component, ReactNode } from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 600 }}>
            <CardContent>
              <Box sx={{ textAlign: 'center' }}>
                <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Something went wrong
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {this.state.error?.message || 'An unexpected error occurred'}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => this.setState({ hasError: false, error: null })}
                >
                  Try Again
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}
