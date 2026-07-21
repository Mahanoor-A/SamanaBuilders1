from rest_framework import viewsets, permissions
from .models import Project, Plot
from .serializers import ProjectSerializer, PlotSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]


class PlotViewSet(viewsets.ModelViewSet):
    queryset = Plot.objects.select_related('project').all()
    serializer_class = PlotSerializer
    permission_classes = [permissions.IsAuthenticated]
