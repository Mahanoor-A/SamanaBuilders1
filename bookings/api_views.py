from rest_framework import viewsets, permissions
from .models import Booking, InstallmentPlan, Installment
from .serializers import BookingSerializer, InstallmentPlanSerializer, InstallmentSerializer


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related('customer', 'plot', 'plot__project').all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        booking = serializer.save(created_by=self.request.user)
        # Update plot status
        plot = booking.plot
        plot.status = 'booked'
        plot.save()


class InstallmentPlanViewSet(viewsets.ModelViewSet):
    queryset = InstallmentPlan.objects.all()
    serializer_class = InstallmentPlanSerializer
    permission_classes = [permissions.IsAuthenticated]


class InstallmentViewSet(viewsets.ModelViewSet):
    queryset = Installment.objects.all()
    serializer_class = InstallmentSerializer
    permission_classes = [permissions.IsAuthenticated]
