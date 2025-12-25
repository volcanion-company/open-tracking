'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Key as KeyIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { partnerApi } from '@/api';
import { Partner, ApiKey } from '@/types/models';
import { CreatePartnerDto, UpdatePartnerDto, CreateApiKeyDto } from '@/api/partner.api';
import { DataTable, Column } from '@/components/common/DataTable';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function PartnersSettingsPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Partner dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<CreatePartnerDto>({
    name: '',
    code: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // API Key dialog
  const [openApiKeyDialog, setOpenApiKeyDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newApiKey, setNewApiKey] = useState<ApiKey | null>(null);
  const [openCreateKeyDialog, setOpenCreateKeyDialog] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyExpiresAt, setKeyExpiresAt] = useState<string>('');
  
  // Notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await partnerApi.getAll();
      setPartners(data.filter((p) => p.status !== 'Deleted'));
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to load partners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.code.trim()) {
      errors.code = 'Code is required';
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.code)) {
      errors.code = 'Code can only contain letters, numbers, hyphens, and underscores';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        name: partner.name,
        code: partner.code,
      });
    } else {
      setEditingPartner(null);
      setFormData({ name: '', code: '' });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPartner(null);
    setFormData({ name: '', code: '' });
    setFormErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingPartner) {
        await partnerApi.update(editingPartner.id, {
          name: formData.name,
          status: editingPartner.status,
        } as UpdatePartnerDto);
        showSnackbar('Partner updated successfully', 'success');
      } else {
        await partnerApi.create(formData);
        showSnackbar('Partner created successfully', 'success');
      }
      handleCloseDialog();
      loadPartners();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save partner', 'error');
    }
  };

  const handleDelete = async (partner: Partner) => {
    if (!confirm(`Are you sure you want to delete "${partner.name}"?`)) return;

    try {
      await partnerApi.delete(partner.id);
      showSnackbar('Partner deleted successfully', 'success');
      loadPartners();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to delete partner', 'error');
    }
  };
  const handleToggleStatus = async (partner: Partner) => {
    try {
      const updated = await partnerApi.toggleStatus(partner.id);
      setPartners(partners.map((p) => (p.id === partner.id ? updated : p)));
      showSnackbar(`Partner ${updated.status === 'Active' ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to toggle partner status', 'error');
    }
  };
  const handleViewApiKeys = async (partner: Partner) => {
    setSelectedPartner(partner);
    setNewApiKey(null);
    
    try {
      const keys = await partnerApi.getApiKeys(partner.id);
      setApiKeys(keys.filter((k) => k.status === 'Active'));
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to load API keys', 'error');
      setApiKeys([]);
    }
    
    setOpenApiKeyDialog(true);
  };

  const handleCreateApiKey = async () => {
    if (!selectedPartner || !keyName.trim()) return;

    try {
      const payload: CreateApiKeyDto = { 
        name: keyName.trim()
      };
      if (keyExpiresAt) {
        payload.expiresAt = new Date(keyExpiresAt).toISOString();
      }
      
      const newKey = await partnerApi.createApiKey(selectedPartner.id, payload);
      
      setNewApiKey(newKey);
      setKeyName('');
      setKeyExpiresAt('');
      setOpenCreateKeyDialog(false);
      showSnackbar('API key created successfully', 'success');
      
      const keys = await partnerApi.getApiKeys(selectedPartner.id);
      setApiKeys(keys.filter((k) => k.status === 'Active'));
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to create API key', 'error');
    }
  };

  const handleRegenerateKey = async (keyId: string) => {
    if (!selectedPartner) return;
    if (!confirm('This will invalidate the current key. Continue?')) return;

    try {
      const regeneratedKey = await partnerApi.regenerateApiKey(selectedPartner.id, keyId);
      setNewApiKey(regeneratedKey);
      showSnackbar('API key regenerated successfully', 'success');
      
      const keys = await partnerApi.getApiKeys(selectedPartner.id);
      setApiKeys(keys.filter((k) => k.status === 'Active'));
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to regenerate API key', 'error');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!selectedPartner) return;
    if (!confirm('Are you sure you want to revoke this API key?')) return;

    try {
      await partnerApi.revokeApiKey(selectedPartner.id, keyId);
      showSnackbar('API key revoked successfully', 'success');
      
      const keys = await partnerApi.getApiKeys(selectedPartner.id);
      setApiKeys(keys.filter((k) => k.status === 'Active'));
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to revoke API key', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSnackbar('Copied to clipboard!', 'success');
  };

  const columns: Column<Partner>[] = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        sortable: true,
        filterable: true,
        render: (row) => row.name,
      },
      {
        id: 'code',
        label: 'Code',
        sortable: true,
        filterable: true,
        render: (row) => <Chip label={row.code} size="small" />,
      },
      {
        id: 'status',
        label: 'Status',
        sortable: true,
        filterable: true,
        render: (row) => (
          <Chip
            label={row.status}
            color={row.status === 'Active' ? 'success' : 'default'}
            size="small"
          />
        ),
      },
      {
        id: 'createdAt',
        label: 'Created',
        sortable: true,
        getValue: (row) => new Date(row.createdAt),
        render: (row) => new Date(row.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        width: 150,
        render: (row) => (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title={row.status === 'Active' ? 'Deactivate' : 'Activate'}>
              <IconButton onClick={() => handleToggleStatus(row)} size="small">
                {row.status === 'Active' ? (
                  <BlockIcon fontSize="small" sx={{ color: 'error.main' }} />
                ) : (
                  <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="API Keys">
              <IconButton onClick={() => handleViewApiKeys(row)} size="small">
                <KeyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton onClick={() => handleOpenDialog(row)} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton onClick={() => handleDelete(row)} size="small" color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    []
  );

  return (
    <ErrorBoundary>
      <Box>
        <DataTable
          columns={columns}
          data={partners}
          keyExtractor={(row) => row.id}
          defaultSortBy="name"
          searchPlaceholder="Search partners..."
          emptyMessage="No partners found. Create your first partner to get started."
          loading={loading}
          toolbarActions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Partner
            </Button>
          }
        />

        {/* Create/Edit Partner Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingPartner ? 'Edit Partner' : 'Create Partner'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!formErrors.name}
                helperText={formErrors.name}
                fullWidth
                required
              />
              <TextField
                label="Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                error={!!formErrors.code}
                helperText={formErrors.code || 'Unique identifier (cannot be changed after creation)'}
                fullWidth
                required
                disabled={!!editingPartner}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingPartner ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* API Keys Dialog */}
        <Dialog open={openApiKeyDialog} onClose={() => setOpenApiKeyDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>API Keys - {selectedPartner?.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateKeyDialog(true)}
              >
                Create New Key
              </Button>
            </Box>

            {newApiKey?.apiKey && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Box>
                  <strong>⚠️ Save this key now - it won't be shown again!</strong>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <TextField
                      value={newApiKey.apiKey}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                    />
                    <IconButton onClick={() => copyToClipboard(newApiKey.apiKey!)}>
                      <CopyIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Alert>
            )}

            <DataTable
              columns={[
                { id: 'name', label: 'Name', sortable: true, filterable: true },
                {
                  id: 'createdAt',
                  label: 'Created',
                  sortable: true,
                  getValue: (row) => new Date(row.createdAt),
                  render: (row) => new Date(row.createdAt).toLocaleDateString(),
                },
                {
                  id: 'lastUsedAt',
                  label: 'Last Used',
                  sortable: true,
                  getValue: (row) => row.lastUsedAt ? new Date(row.lastUsedAt) : null,
                  render: (row) => row.lastUsedAt ? new Date(row.lastUsedAt).toLocaleDateString() : 'Never',
                },
                {
                  id: 'actions',
                  label: 'Actions',
                  align: 'right',
                  render: (row) => (
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="Regenerate">
                        <IconButton onClick={() => handleRegenerateKey(row.id)} size="small">
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Revoke">
                        <IconButton onClick={() => handleRevokeKey(row.id)} size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ),
                },
              ]}
              data={apiKeys}
              keyExtractor={(row) => row.id}
              defaultSortBy="createdAt"
              enableSearch={false}
              emptyMessage="No API keys found"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenApiKeyDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Create API Key Dialog */}
        <Dialog open={openCreateKeyDialog} onClose={() => setOpenCreateKeyDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogContent>
            <TextField
              label="Key Name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
              placeholder="e.g., Production Key"
              autoFocus
            />
            <TextField
              label="Expiration Date"
              type="date"
              value={keyExpiresAt}
              onChange={(e) => setKeyExpiresAt(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
              helperText="Leave empty for no expiration"
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: new Date().toISOString().split('T')[0],
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateKeyDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateApiKey} variant="contained" disabled={!keyName.trim()}>
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
}
