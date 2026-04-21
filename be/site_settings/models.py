from django.db import models
from django.utils.translation import gettext_lazy as _

class SiteSetting(models.Model):
    # Share configuration
    total_shares = models.PositiveIntegerField(default=10000, help_text=_("Total number of shares issued by the company"))
    share_price = models.DecimalField(max_digits=15, decimal_places=2, default=1000000, help_text=_("Estimated price per share"))
    max_share_per_investor = models.PositiveIntegerField(default=50, help_text=_("Maximum ownership percentage per investor (0-100)"))

    # Company profile
    company_name = models.CharField(max_length=100, default="Integrated Estate")
    support_email = models.EmailField(default="admin@lahanpintar.com")
    
    # System preferences
    enable_notifications = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        # Force a single-row singleton by always saving with pk=1
        self.pk = 1
        super(SiteSetting, self).save(*args, **kwargs)

    def __str__(self):
        return "Primary System Configuration"
